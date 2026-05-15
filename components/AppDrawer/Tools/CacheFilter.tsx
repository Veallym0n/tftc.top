import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal, defaultModalClasses } from '../../../libs/common/Modal';
import { CONFIG } from '../../../constants';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type FieldKey =
  | 'code'
  | 'geocacheType'
  | 'containerType'
  | 'difficulty'
  | 'terrain'
  | 'favoritePoints'
  | 'placedDate'
  | 'lastFoundDate'
  | 'ownerUsername';

type FieldType = 'multiSelect' | 'number' | 'date' | 'string';

interface FieldDef {
  label: string;
  type: FieldType;
  operators: string[];
  options?: { value: number | string; label: string }[];
}

const FIELDS: Record<FieldKey, FieldDef> = {
  code: {
    label: 'CacheCode',
    type: 'string',
    operators: ['=', '!=', 'contains', 'startsWith'],
  },
  geocacheType: {
    label: '宝藏类型',
    type: 'multiSelect',
    operators: ['in', 'not in'],
    options: Object.entries(CONFIG.cacheTypes).map(([v, c]) => ({ value: Number(v), label: c.name })),
  },
  containerType: {
    label: '容器大小',
    type: 'multiSelect',
    operators: ['in', 'not in'],
    options: Object.entries(CONFIG.containerTypes).map(([v, l]) => ({ value: Number(v), label: l })),
  },
  difficulty: {
    label: '寻宝难度(D)',
    type: 'number',
    operators: ['=', '!=', '>', '<', '>=', '<='],
  },
  terrain: {
    label: '地形难度(T)',
    type: 'number',
    operators: ['=', '!=', '>', '<', '>=', '<='],
  },
  favoritePoints: {
    label: 'FP',
    type: 'number',
    operators: ['=', '!=', '>', '<', '>=', '<='],
  },
  placedDate: {
    label: '藏宝日期',
    type: 'date',
    operators: ['=', '>', '<', '>=', '<='],
  },
  lastFoundDate: {
    label: '最后找到时间',
    type: 'date',
    operators: ['=', '>', '<', '>=', '<='],
  },
  ownerUsername: {
    label: 'CacheOwner',
    type: 'string',
    operators: ['=', '!=', 'contains', 'startsWith'],
  },
};

const FIELD_KEYS = Object.keys(FIELDS) as FieldKey[];

// ──────────────────────────────────────────────────────────────
// Condition row state
// ──────────────────────────────────────────────────────────────

interface ConditionState {
  id: number;
  field: FieldKey;
  operator: string;
  // For multiSelect: number[], for others: string
  value: string | number[];
  negate: boolean;
}

let _uid = 0;
const nextId = () => ++_uid;

function defaultCondition(): ConditionState {
  const field: FieldKey = 'geocacheType';
  return {
    id: nextId(),
    field,
    operator: FIELDS[field].operators[0],
    value: [],
    negate: false,
  };
}

// OR group = array of conditions (AND)
type AndGroup = ConditionState[];

// ──────────────────────────────────────────────────────────────
// Build output JSON
// ──────────────────────────────────────────────────────────────

function buildJSON(groups: AndGroup[]): unknown {
  return groups.map((group) =>
    group.map((c) => [c.field, c.operator, c.value, c.negate])
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

const MultiSelectDropdown: React.FC<{
  options: { value: number | string; label: string }[];
  selected: number[];
  onChange: (v: number[]) => void;
}> = ({ options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  };

  const toggle = (v: number) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  };

  const label =
    selected.length === 0
      ? '请选择…'
      : options
          .filter((o) => selected.includes(o.value as number))
          .map((o) => o.label)
          .join('、');

  const panel = open && rect ? createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }}
      className="bg-white border-2 border-slate-300 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="max-h-52 overflow-y-auto">
        {options.map((o) => {
          const checked = selected.includes(o.value as number);
          return (
            <label
              key={o.value}
              className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none ${
                checked ? 'bg-blue-50 text-slate-800' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span
                className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center text-[10px] ${
                  checked ? 'bg-memphis-blue border-memphis-blue text-white' : 'border-slate-300'
                }`}
              >
                {checked && '✓'}
              </span>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(o.value as number)} />
              <span className={`text-xs ${checked ? 'font-bold' : 'font-medium'}`}>{o.label}</span>
            </label>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="border-t border-slate-100 px-3 py-1.5 flex justify-end">
          <button type="button" onClick={() => onChange([])} className="text-[11px] text-slate-400 hover:text-red-400 font-bold">
            清除选择
          </button>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between px-2 py-1 rounded border text-xs font-medium ${
          open ? 'border-memphis-blue bg-white text-slate-700' : 'border-transparent bg-transparent text-slate-500 hover:border-slate-200'
        }`}
      >
        <span className={`truncate ${selected.length > 0 ? 'text-slate-700 font-semibold' : ''}`}>{label}</span>
        <span className="ml-1 shrink-0 text-slate-400 text-[10px]">{open ? '▴' : '▾'}</span>
      </button>
      {panel}
    </div>
  );
};

const ConditionRow: React.FC<{
  cond: ConditionState;
  onChange: (c: ConditionState) => void;
  onRemove: () => void;
  canRemove: boolean;
}> = ({ cond, onChange, onRemove, canRemove }) => {
  const fieldDef = FIELDS[cond.field];
  const isMulti = fieldDef.type === 'multiSelect';

  const handleFieldChange = (field: FieldKey) => {
    const def = FIELDS[field];
    onChange({
      ...cond,
      field,
      operator: def.operators[0],
      value: def.type === 'multiSelect' ? [] : '',
    });
  };

  const handleValueChange = (v: string | number[]) => onChange({ ...cond, value: v });

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${
      cond.negate ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'
    }`}>

      {/* Field */}
      <select
        value={cond.field}
        onChange={(e) => handleFieldChange(e.target.value as FieldKey)}
        className="w-20 shrink-0 text-xs font-semibold bg-transparent border-0 focus:outline-none text-slate-700 cursor-pointer"
      >
        {FIELD_KEYS.map((k) => (
          <option key={k} value={k}>{FIELDS[k].label}</option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={cond.operator}
        onChange={(e) => onChange({ ...cond, operator: e.target.value })}
        className="shrink-0 text-xs font-bold bg-slate-100 border-0 rounded px-1.5 py-1 focus:outline-none text-slate-500 cursor-pointer"
      >
        {fieldDef.operators.map((op) => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>

      {/* Value */}
      <div className="flex-1 min-w-0">
        {isMulti ? (
          <MultiSelectDropdown
            options={fieldDef.options!}
            selected={Array.isArray(cond.value) ? (cond.value as number[]) : []}
            onChange={handleValueChange}
          />
        ) : fieldDef.type === 'date' ? (
          <input
            type="date"
            value={cond.value as string}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full text-xs bg-transparent border-0 focus:outline-none text-slate-700"
          />
        ) : fieldDef.type === 'number' ? (
          <input
            type="number"
            step="0.5" min="1" max="10"
            placeholder="数值"
            value={cond.value as string}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full text-xs bg-transparent border-0 focus:outline-none text-slate-700 placeholder:text-slate-300"
          />
        ) : (
          <input
            type="text"
            placeholder="用户名"
            value={cond.value as string}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full text-xs bg-transparent border-0 focus:outline-none text-slate-700 placeholder:text-slate-300"
          />
        )}
      </div>

      {/* NOT toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...cond, negate: !cond.negate })}
        className={`shrink-0 px-1.5 py-0.5 rounded text-[11px] font-black ${
          cond.negate ? 'bg-red-100 text-red-500' : 'text-slate-300 hover:text-slate-500'
        }`}
      >
        NOT
      </button>

      {/* Remove */}
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-slate-300 hover:text-red-400 text-sm leading-none"
        >
          ✕
        </button>
      ) : <div className="w-3" />}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Main Modal
// ──────────────────────────────────────────────────────────────

const CacheFilter = NiceModal.create(() => {
  const modal = useModal();

  const [groups, setGroups] = useState<AndGroup[]>([[defaultCondition()]]);

  // ── helpers ──

  const updateGroup = (gi: number, group: AndGroup) =>
    setGroups((prev) => prev.map((g, i) => (i === gi ? group : g)));

  const addGroup = () => setGroups((prev) => [...prev, [defaultCondition()]]);

  const removeGroup = (gi: number) =>
    setGroups((prev) => prev.filter((_, i) => i !== gi));

  const addCondition = (gi: number) =>
    updateGroup(gi, [...groups[gi], defaultCondition()]);

  const removeCondition = (gi: number, ci: number) =>
    updateGroup(gi, groups[gi].filter((_, i) => i !== ci));

  const updateCondition = (gi: number, ci: number, cond: ConditionState) =>
    updateGroup(gi, groups[gi].map((c, i) => (i === ci ? cond : c)));

  // ── apply ──

  const handleApply = () => {
    const result = buildJSON(groups);
    console.log('[CacheFilter] Generated filter JSON:', JSON.stringify(result, null, 2));
    modal.remove();
  };

  return (
    <Modal
      {...defaultModalClasses}
      contentClassName="relative bg-white w-full max-w-2xl rounded-3xl border-2 border-memphis-dark shadow-memphis-lg scale-100 animate-fade-in overflow-hidden"
      isOpen={modal.visible}
      onClose={modal.remove}
      title="🔧 Cache Filter"
      footer={
        <div className="w-full flex justify-between items-center">
          <button
            onClick={modal.remove}
            className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-memphis-blue text-white font-bold border-2 border-memphis-dark rounded-xl hover:brightness-110 transition-all shadow-memphis-sm text-sm"
          >
            应用筛选 →
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 max-h-[62vh] overflow-y-auto">

        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {/* OR separator (between groups) */}
            {gi > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            {/* Group card */}
            <div className="rounded-2xl border-2 border-slate-200">
              {/* Group header */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  {gi === 0 ? '条件组' : `条件组 ${gi + 1}`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addCondition(gi)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-memphis-blue bg-memphis-blue/10 rounded-lg hover:bg-memphis-blue/20 transition-all"
                  >
                    <span>＋</span><span>AND 条件</span>
                  </button>
                  {groups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGroup(gi)}
                      className="p-1 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                      title="删除此组"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Conditions */}
              <div className="p-2 flex flex-col gap-1.5">
                {group.map((cond, ci) => (
                  <React.Fragment key={cond.id}>
                    {ci > 0 && (
                      <div className="flex items-center gap-2 px-1">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] font-black text-slate-300">AND</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>
                    )}
                    <ConditionRow
                      cond={cond}
                      onChange={(c) => updateCondition(gi, ci, c)}
                      onRemove={() => removeCondition(gi, ci)}
                      canRemove={group.length > 1}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </React.Fragment>
        ))}

        {/* Add OR group */}
        <button
          onClick={addGroup}
          className="w-full py-2.5 text-xs font-bold text-slate-400 border-2 border-dashed border-slate-200 rounded-xl hover:border-memphis-blue hover:text-memphis-blue transition-all"
        >
          ＋ 添加 OR 条件组
        </button>

      </div>
    </Modal>
  );
});

export default CacheFilter;
