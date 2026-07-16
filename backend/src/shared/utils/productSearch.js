const PRODUCT_SEARCH_FIELDS = [
  'name',
  'product_name_vn',
  'product_name_en',
  'brand',
  'benefits',
  'product_type',
  'skin_type',
  'description',
  'shortDescription',
  'detailDescription',
  'ingredients',
  'usage_instructions',
  'category_level_1',
  'category_level_2'
];

const PRODUCT_IDENTITY_FIELDS = [
  'name',
  'product_name_vn',
  'product_type'
];

const PRODUCT_BENEFIT_FIELDS = [
  'name',
  'product_name_vn',
  'product_name_en',
  'benefits'
];

const KNOWN_PRODUCT_TYPES = [
  'sua rua mat',
  'kem chong nang',
  'dau tay trang',
  'kem duong',
  'kem mat',
  'xit khoang',
  'sua duong',
  'tay trang',
  'mat na',
  'treatment',
  'cushion',
  'lotion',
  'toner',
  'serum',
  'son'
].sort((left, right) => right.length - left.length);

const KNOWN_BENEFIT_PHRASES = [
  'duong am',
  'cap am'
].sort((left, right) => right.length - left.length);

const BENEFIT_PHRASE_ALIASES = {
  'duong am': ['duong am', 'cap am', 'cap nuoc'],
  'cap am': ['cap am', 'duong am', 'cap nuoc']
};

const STRICT_PRODUCT_TYPE_ALIASES = {
  serum: ['serum / tinh chat']
};

const VIETNAMESE_CHARACTER_GROUPS = {
  a: 'aàáạảãâầấậẩẫăằắặẳẵ',
  d: 'dđ',
  e: 'eèéẹẻẽêềếệểễ',
  i: 'iìíịỉĩ',
  o: 'oòóọỏõôồốộổỗơờớợởỡ',
  u: 'uùúụủũưừứựửữ',
  y: 'yỳýỵỷỹ'
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeVietnameseText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const buildVietnameseInsensitivePattern = (value) =>
  [...normalizeVietnameseText(value)]
    .map((character) => {
      if (character === ' ') return '\\s+';
      const group = VIETNAMESE_CHARACTER_GROUPS[character];
      return group ? `[${group}]` : escapeRegex(character);
    })
    .join('');

const buildFieldMatch = (term, fields = PRODUCT_SEARCH_FIELDS) => {
  const regex = new RegExp(buildVietnameseInsensitivePattern(term), 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex }))
  };
};

const buildFieldMatchAny = (terms, fields = PRODUCT_SEARCH_FIELDS) => {
  const pattern = terms.map(buildVietnameseInsensitivePattern).join('|');
  const regex = new RegExp(`(?:${pattern})`, 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex }))
  };
};

const hasWholePhrase = (normalizedText, phrase) => {
  const pattern = new RegExp(`(^|\\s)${escapeRegex(phrase)}(?=\\s|$)`);
  return pattern.test(normalizedText);
};

const findPhrases = (normalizedText, phrases) =>
  phrases.filter((phrase) => hasWholePhrase(normalizedText, phrase));

const findProductType = (normalizedText) =>
  KNOWN_PRODUCT_TYPES.find((productType) => hasWholePhrase(normalizedText, productType));

const tokenize = (value) => value.match(/[\p{L}\p{N}]+/gu) || [];

const buildSearchTerms = (normalized) => {
  const phrases = findPhrases(normalized, [
    ...KNOWN_PRODUCT_TYPES,
    ...KNOWN_BENEFIT_PHRASES
  ]);
  const withoutKnownPhrases = phrases.reduce(
    (current, phrase) => current.replace(new RegExp(`(^|\\s)${escapeRegex(phrase)}(?=\\s|$)`, 'g'), ' '),
    normalized
  );

  return [...new Set([...phrases, ...tokenize(withoutKnownPhrases)])];
};

const buildPreferredMatch = (normalized, terms) => {
  const productType = findProductType(normalized);
  if (!productType) return null;

  const productTypeRegex = new RegExp(buildVietnameseInsensitivePattern(productType), 'i');
  const identityMatch = STRICT_PRODUCT_TYPE_ALIASES[productType]
    ? buildFieldMatchAny(STRICT_PRODUCT_TYPE_ALIASES[productType], ['product_type'])
    : {
        $or: PRODUCT_IDENTITY_FIELDS.map((field) => ({ [field]: productTypeRegex }))
      };
  const benefitPhrases = findPhrases(normalized, KNOWN_BENEFIT_PHRASES);
  const consumedTerms = new Set([productType, ...benefitPhrases]);
  const benefitMatches = benefitPhrases.map((phrase) =>
    buildFieldMatchAny(BENEFIT_PHRASE_ALIASES[phrase] || [phrase], PRODUCT_BENEFIT_FIELDS)
  );
  const remainingTermMatches = terms
    .filter((term) => !consumedTerms.has(term))
    .map((term) => buildFieldMatch(term));

  return {
    $and: [
      identityMatch,
      ...benefitMatches,
      ...remainingTermMatches
    ]
  };
};

const buildProductSearchQuery = (searchText) => {
  const normalized = normalizeVietnameseText(searchText);
  const tokens = [...new Set(tokenize(normalized))];
  if (!tokens.length) return null;

  const terms = buildSearchTerms(normalized);
  const termMatches = terms.map((term) => buildFieldMatch(term));
  return {
    normalized,
    tokens,
    terms,
    preferred: buildPreferredMatch(normalized, terms),
    strong: { $and: termMatches },
    fallback: { $or: termMatches }
  };
};

module.exports = {
  PRODUCT_SEARCH_FIELDS,
  PRODUCT_IDENTITY_FIELDS,
  PRODUCT_BENEFIT_FIELDS,
  escapeRegex,
  normalizeVietnameseText,
  buildVietnameseInsensitivePattern,
  buildProductSearchQuery
};
