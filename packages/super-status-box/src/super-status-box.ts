import type { defineSuperStatus } from './define-super-status';
import type { GetEnumOptions } from './types';
import type { L } from 'ts-toolbelt';

export class SuperStatusBox<
  S extends ReturnType<typeof defineSuperStatus>,
  UnionStatusKeys extends S[number]['key'] = S[number]['key'],
  UnionStatusAliases extends S[number]['alias'] = S[number]['alias']
> {
  constructor(private readonly status: S) {}

  /** 返回所有别名 */
  aliasOf = (): UnionStatusAliases[] => {
    return this.status.map(item => item.alias as UnionStatusAliases);
  };

  /** 挑选部分别名 */
  pickAliases = <T extends UnionStatusAliases>(aliases: ReadonlyArray<T>): ReadonlyArray<T> => {
    return this.status.filter(item => aliases.includes(item.alias as T)).map(item => item.alias as T);
  };

  /** 排除部分别名，返回未被排除的那一部分 */
  omitAliases = <T extends UnionStatusAliases>(
    aliases: ReadonlyArray<T>
  ): ReadonlyArray<Exclude<UnionStatusAliases, T>> => {
    return this.status
      .filter(item => !aliases.includes(item.alias as any))
      .map(item => item.alias as UnionStatusAliases) as any;
  };

  // getAllOptions = (
  //   params?: Omit<GetOptionsParams, 'specifySymbolMerge'> & {
  //     eachMergeContent?: Record<string, any>;
  //   }
  // ) => {
  //   const {
  //     returnAlias = false,
  //     fieldNameOfKey = 'value',
  //     fieldNameOfValue = 'label',
  //     eachMergeContent = {}
  //   } = params ?? {};

  //   return Object.entries(this.status).map(([k, v]) => ({
  //     [fieldNameOfKey]: k,
  //     [fieldNameOfValue]: v.unifyLabel,
  //     ...eachMergeContent,
  //     ...(returnAlias ? { alias: v.alias as UnionStatusAliases } : {})
  //   }));
  // };

  // getOptionsByKeys = <T extends UnionStatusKeys>(
  //   keys: ReadonlyArray<T>,
  //   params?: GetOptionsParams<T, Record<string, any>>
  // ) => {
  //   const { fieldNameOfKey = 'value', fieldNameOfValue = 'label', specifySymbolMerge = [] } = params ?? {};

  //   return Object.entries(this.status)
  //     .filter(([k]) => keys.includes(k as T))
  //     .map(([k, v]) => ({
  //       [fieldNameOfKey]: k,
  //       [fieldNameOfValue]: v.unifyLabel,
  //       ...specifySymbolMerge.find(([_key]) => _key === k)
  //     }));
  // };

  // getOptionsByAliases = <T extends UnionStatusAliases>(
  //   aliases: ReadonlyArray<T>,
  //   params?: GetOptionsParams<T, Record<string, any>>
  // ) => {
  //   const { fieldNameOfKey = 'value', fieldNameOfValue = 'label', specifySymbolMerge = [] } = params ?? {};

  //   return Object.entries(this.status)
  //     .filter(([, v]) => aliases.includes(v.alias as T))
  //     .map(([k, v]) => ({
  //       [fieldNameOfKey]: k,
  //       [fieldNameOfValue]: v.unifyLabel,
  //       ...specifySymbolMerge.find(([_aliases]) => _aliases === (v.alias as T))
  //     }));
  // };

  /**
   * 获取所有枚举，枚举类型为：Record<string, string>
   * @see 查看测试用例以帮助理解 -> {@link https://github.com/xlboy/mimi-utils/blob/master/packages/super-status-box/src/__test__/super-status-box.test.ts#L39}
   */
  getAllEnum = (options?: GetEnumOptions<UnionStatusAliases>) => {
    const hasOptions = options !== undefined;

    return hasOptions ? this.statusConverToEnumByOptions(this.status, options!) : this.statusConverToEnum(this.status);
  };

  /**
   * 根据别名获取相应的枚举
   * @see 查看测试用例以帮助理解 -> {@link https://github.com/xlboy/mimi-utils/blob/master/packages/super-status-box/src/__test__/super-status-box.test.ts#L66}
   */
  getEnumByAliases = <T extends UnionStatusAliases>(
    aliases: ReadonlyArray<T>,
    options?: GetEnumOptions<UnionStatusAliases>
  ) => {
    const hasOptions = options !== undefined;

    const filteredStatusByAliases = this.status.filter(item => aliases.includes(item.alias as T)) as unknown as S;

    return hasOptions
      ? this.statusConverToEnumByOptions(filteredStatusByAliases, options!)
      : this.statusConverToEnum(filteredStatusByAliases);
  };

  private statusConverToEnumByOptions = (status: S, options: GetEnumOptions<UnionStatusAliases>) => {
    const { groupToReplace } = options;

    return status.reduce((preValue, currentValue) => {
      const mergeSource: Record<string, string> = {
        // 默认赋值，可能会因为「matchingReplaceSource」而顶替掉 Value
        [currentValue.key]: currentValue.unifyLabel
      };

      const matchingReplaceSource = groupToReplace.find(([statusAlias]) => statusAlias === currentValue.alias);

      if (matchingReplaceSource) {
        const [, textToReplace] = matchingReplaceSource;

        mergeSource[currentValue.key] = textToReplace;
      }

      return {
        ...preValue,
        ...mergeSource
      };
    }, {} as Record<UnionStatusAliases, string>);
  };

  private statusConverToEnum = (status: S) => {
    return status.reduce((preValue, currentValue) => {
      return {
        ...preValue,
        [currentValue.key]: currentValue.unifyLabel
      };
    }, {} as Record<UnionStatusAliases, string>);
  };

  /**
   * 根据单个别名查找相应的 status-key
   * @see 查看测试用例以帮助理解 -> {@link https://github.com/xlboy/mimi-utils/blob/master/packages/super-status-box/src/__test__/super-status-box.test.ts#L94}
   */
  findKeyByAlias = <T extends UnionStatusAliases>(alias: T): S[L.SelectKeys<S, { alias: T }>]['key'] | undefined => {
    const foundKey = this.status.find(item => item.alias === alias);

    return foundKey?.key as any;
  };

  /**
   * 根据多个别名查找相应的 status-key
   * @see 查看测试用例以帮助理解 -> {@link https://github.com/xlboy/mimi-utils/blob/master/packages/super-status-box/src/__test__/super-status-box.test.ts#L102}
   */
  findKeysByAliases = <T extends ReadonlyArray<UnionStatusAliases>>(
    aliases: T
  ): /** TODO: 此类型待完善 */ UnionStatusKeys[] => {
    const foundKeys = this.status.filter(item => aliases.includes(item.alias as any)).map(item => item.key);

    return foundKeys as any;
  };
}
