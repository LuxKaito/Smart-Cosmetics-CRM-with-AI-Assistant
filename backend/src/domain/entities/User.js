class User {
  constructor({ id, email, role, name, isBlocked = false }) {
    this.id = id;
    this.email = email;
    this.role = role;
    this.name = name;
    this.isBlocked = isBlocked;
  }
}

module.exports = User;
