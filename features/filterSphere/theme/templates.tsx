import {
  createFilterGroup,
  createSingleFilter,
  useFilterRule,
  useRootRule,
  useView,
} from '@fn-sphere/filter';
import type { FilterTheme } from '@fn-sphere/filter';

type Templates = FilterTheme['templates'];

const SingleFilterTemplate: Templates['SingleFilter'] = ({ rule }) => {
  const {
    ruleState: { isLastRule, isValid, parentGroup },
    removeRule,
    appendRule,
  } = useFilterRule(rule);
  const { rootRule, numberOfRules, setRootRule, getLocaleText } = useRootRule();
  const { Button: ButtonView } = useView('components');
  const { FieldSelect, FilterSelect, FilterDataInput } = useView('templates');

  const lastCondition = rootRule.conditions[rootRule.conditions.length - 1];
  const isLastRuleInGroup = isLastRule && lastCondition?.id === parentGroup.id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FieldSelect rule={rule} />
      <FilterSelect rule={rule} />
      <FilterDataInput rule={rule} />

      <ButtonView onClick={() => appendRule(createSingleFilter())}>
        {getLocaleText('operatorAnd')}
      </ButtonView>
      {isLastRuleInGroup && (
        <ButtonView
          onClick={() => {
            rootRule.conditions.push(
              createFilterGroup({
                op: 'and',
                conditions: [createSingleFilter()],
              }),
            );
            setRootRule(rootRule);
          }}
        >
          {getLocaleText('operatorOr')}
        </ButtonView>
      )}
      {!isValid && (
        <span className="text-base font-bold text-red-600" aria-hidden>
          ⚠
        </span>
      )}
      {numberOfRules > 1 && (
        <button
          type="button"
          aria-label={getLocaleText('deleteRule')}
          onClick={() => removeRule(true)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border-2 border-memphis-dark bg-white text-sm font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-memphis-pink hover:text-white active:translate-y-0.5"
        >
          ✕
        </button>
      )}
    </div>
  );
};

const FilterGroupContainerTemplate: Templates['FilterGroupContainer'] = ({
  children,
}) => {
  return <div className="flex flex-col items-start">{children}</div>;
};

const RuleJoinerTemplate: Templates['RuleJoiner'] = ({
  joinBetween: [before, after],
  parent,
}) => {
  const { Button: ButtonView } = useView('components');
  const { getLocaleText } = useRootRule();
  const label =
    parent.op === 'and'
      ? getLocaleText('operatorAnd')
      : getLocaleText('operatorOr');

  if (before.type === 'Filter' && after.type === 'Filter') {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="h-3 w-0.5 rounded-md bg-memphis-dark/30" />
        <ButtonView disabled>{label}</ButtonView>
        <div className="h-3 w-0.5 rounded-md bg-memphis-dark/30" />
      </div>
    );
  }
  return (
    <ButtonView disabled className="my-4">
      {label}
    </ButtonView>
  );
};

export const flattenTemplates = {
  SingleFilter: SingleFilterTemplate,
  FilterGroupContainer: FilterGroupContainerTemplate,
  RuleJoiner: RuleJoinerTemplate,
} satisfies Partial<Templates>;
