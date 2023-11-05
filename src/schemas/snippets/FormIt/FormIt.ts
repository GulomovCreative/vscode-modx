import { t } from '@vscode/l10n';
import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'FormIt';
export const description = t('FormIt.description');

export const link = 'index';

export const props = [
  {
    name: 'preHooks',
  },
  {
    name: 'renderHooks',
  },
  {
    name: 'hooks',
  },
  {
    name: 'submitVar',
  },
  {
    name: 'validate',
  },
  {
    name: 'validationErrorMessage',
    default: t('FormIt.prop.validationErrorMessage.default'),
  },
  {
    name: 'validationErrorBulkTpl',
    default: '[[+error]]',
  },
  {
    name: 'errTpl',
    default: '[[+error]]',
  },
  {
    name: 'customValidators',
  },
  {
    name: 'clearFieldsOnSuccess',
    default: 1,
  },
  {
    name: 'store',
    default: 0,
  },
  {
    name: 'storeTime',
    default: 300,
  },
  {
    name: 'storeLocation',
    default: 'cache',
  },
  {
    name: 'placeholderPrefix',
    default: 'fi.',
  },
  {
    name: 'successMessage',
  },
  {
    name: 'successMessagePlaceholder',
    default: 'fi.successMessage',
  },
  {
    name: 'redirectTo',
    type: 'number',
  },
  {
    name: 'allowFiles',
    default: 1,
  },
  {
    name: 'attachFilesToEmail',
    default: 1,
  },

  {
    name: 'emailTpl',
  },
  {
    name: 'emailSubject',
  },
  {
    name: 'emailUseFieldForSubject',
  },
  {
    name: 'emailTo',
  },
  {
    name: 'emailToName',
  },
  {
    name: 'emailFrom',
  },
  {
    name: 'emailFromName',
  },
  {
    name: 'emailHtml',
    default: 1,
  },
  {
    name: 'emailConvertNewlines',
    default: 0,
  },
  {
    name: 'emailReplyTo',
  },
  {
    name: 'emailReplyToName',
  },
  {
    name: 'emailCC',
  },
  {
    name: 'emailCCName',
  },
  {
    name: 'emailBCC',
  },
  {
    name: 'emailBCCName',
  },
  {
    name: 'emailMultiWrapper',
  },
  {
    name: 'emailMultiSeparator',
  },
  {
    name: 'emailSelectField',
  },
  {
    name: 'emailSelectTo',
  },
  {
    name: 'emailSelectToName',
  },

  {
    name: 'fiarTpl',
  },
  {
    name: 'fiarSubject',
  },
  {
    name: 'fiarToField',
  },
  {
    name: 'fiarFrom',
  },
  {
    name: 'fiarFromName',
  },
  {
    name: 'fiarSender',
  },
  {
    name: 'fiarHtml',
    default: 1,
  },
  {
    name: 'fiarReplyTo',
  },
  {
    name: 'fiarReplyToName',
  },
  {
    name: 'fiarCC',
  },
  {
    name: 'fiarCCName',
  },
  {
    name: 'fiarBCC',
  },
  {
    name: 'fiarBCCName',
  },
  {
    name: 'fiarMultiWrapper',
  },
  {
    name: 'fiarMultiSeparator',
    default: '\n',
  },
  {
    name: 'fiarFiles',
  },
  {
    name: 'fiarRequired',
    default: 1,
  },

  {
    name: 'savedFormHashKeyField',
    default: 'savedFormHashKey',
  },
  {
    name: 'updateSavedForm',
    default: 0,
  },
  {
    name: 'returnValueOnFail',
    default: 1,
  },

  {
    name: 'formName',
    default: 'form-{resourceid}',
  },
  {
    name: 'formEncrypt',
    default: 0,
  },
  {
    name: 'formFields',
  },
  {
    name: 'fieldNames',
    example: t('FormIt.prop.fieldNames.example'),
  },

  {
    name: 'mathMinRange',
    default: 10,
  },
  {
    name: 'mathMaxRange',
    default: 100,
  },
  {
    name: 'mathField',
    default: 'math',
  },
  {
    name: 'mathOp1Field',
    default: 'op1',
  },
  {
    name: 'mathOp2Field',
    default: 'op2',
  },
  {
    name: 'mathOperatorField',
    default: 'operator',
  },

  {
    name: 'recaptchaJs',
    default: '{}',
  },
  {
    name: 'recaptchaTheme',
    default: 'clean',
  },

  {
    name: 'redirectTo',
  },
  {
    name: 'redirectParams',
  },

  {
    name: 'spamEmailFields',
    default: 'email',
  },
  {
    name: 'spamCheckIp',
    default: 0,
  },
].map(prop => ({ ...prop, description: t(`${name}.prop.${prop.name}`) })) as SnippetProp[];

export default {
  name,
  description,
  link,
  props,
} as SnippetData;
