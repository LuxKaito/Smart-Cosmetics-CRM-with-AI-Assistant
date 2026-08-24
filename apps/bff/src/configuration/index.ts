import { BaseConfiguation } from '@common/configuration/base.config';
import { AppConfiguation } from '@common/configuration/app.config';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class Configuration extends BaseConfiguation {
  @ValidateNested()
  @Type(() => AppConfiguation)
  APP_CONFIG = new AppConfiguation();
}

export const CONFIGURATION = new Configuration();

export type ConfigurationType = typeof CONFIGURATION;

CONFIGURATION.validate();
