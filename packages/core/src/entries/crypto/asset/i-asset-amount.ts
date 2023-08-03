import BigNumber from 'bignumber.js';
import { Asset } from './asset';

export interface IAssetAmount<T extends Asset = Asset> {
    readonly asset: T;

    readonly weiAmount: BigNumber;

    readonly relativeAmount: BigNumber;

    stringAsset: string;

    stringRelativeAmount: string;

    stringWeiAmount: string;

    stringAssetRelativeAmount: string;

    toStringRelativeAmount(precision: number): string;

    toStringAssetRelativeAmount(precision: number): string;

    isGTE(assetAmount: IAssetAmount): boolean;

    isGT(assetAmount: IAssetAmount): boolean;

    isEQ(assetAmount: IAssetAmount): boolean;

    isLTE(assetAmount: IAssetAmount): boolean;

    isLT(assetAmount: IAssetAmount): boolean;
}
