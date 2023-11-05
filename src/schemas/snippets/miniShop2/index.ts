import { joinProps } from '../../../common';
import { SnippetData, SnippetProp } from '../../snippets/';
import { commonProps } from '../pdoTools';

import msProductsData from './msProducts';
import msCartData from './msCart';
import msOrderData from './msOrder';
import msMiniCartData from './msMiniCart';
import msGetOrderData from './msGetOrder';
import msGalleryData from './msGallery';
import msOptionsData from './msOptions';
import msProductOptionsData from './msProductOptions';

import { t } from '@vscode/l10n';

class ms2Snippet implements SnippetData {
  name: string;
  description: string;
  link?: string;
  props: SnippetProp[];

  constructor ({
    name,
    props,
  }: SnippetData) {
    this.name = name;
    this.description = t(`${name}.description`);
    this.link = 'https://docs.modx.pro/components/minishop2/snippets/' + name.toLowerCase();
    this.props = joinProps(
      props.map(prop => ({ ...prop, description: t(`${name}.prop.${prop.name}`) })),
      commonProps.map(prop => ({ ...prop, description: t(`pdoTools.prop.${prop.name}`) }))
    );
  }
}

export const msProducts = new ms2Snippet(msProductsData);
export const msCart = new ms2Snippet(msCartData);
export const msOrder = new ms2Snippet(msOrderData);
export const msMiniCart = new ms2Snippet(msMiniCartData);
export const msGetOrder = new ms2Snippet(msGetOrderData);
export const msGallery = new ms2Snippet(msGalleryData);
export const msOptions = new ms2Snippet(msOptionsData);
export const msProductOptions = new ms2Snippet(msProductOptionsData);

export default [
  msProducts,
  msCart,
  msOrder,
  msMiniCart,
  msGetOrder,
  msGallery,
  msOptions,
  msProductOptions,
];
