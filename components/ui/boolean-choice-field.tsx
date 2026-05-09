type BooleanChoiceFieldProps = {
  label: string;
  name: string;
  defaultValue: boolean;
  trueLabel: string;
  falseLabel: string;
  trueDescription?: string;
  falseDescription?: string;
  className?: string;
  columnsClassName?: string;
};

export function BooleanChoiceField({
  label,
  name,
  defaultValue,
  trueLabel,
  falseLabel,
  trueDescription,
  falseDescription,
  className = "",
  columnsClassName = "sm:grid-cols-2",
}: BooleanChoiceFieldProps) {
  const optionClass =
    "group relative cursor-pointer rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 text-sm text-[var(--text-primary)] transition has-[:checked]:border-stone-950 has-[:checked]:bg-stone-950 has-[:checked]:text-stone-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-stone-950";
  const descriptionClass = "mt-1 block text-xs leading-5 text-[var(--text-secondary)] group-has-[:checked]:text-stone-300";

  return (
    <fieldset className={`grid gap-2 ${className}`}>
      <legend className="text-sm font-semibold text-[var(--text-secondary)]">{label}</legend>
      <div className={`grid gap-2 ${columnsClassName}`}>
        <label className={optionClass}>
          <input className="absolute inset-0 h-full w-full cursor-pointer opacity-0" type="radio" name={name} value="true" defaultChecked={defaultValue} />
          <span className="block font-semibold">{trueLabel}</span>
          {trueDescription ? <span className={descriptionClass}>{trueDescription}</span> : null}
        </label>
        <label className={optionClass}>
          <input className="absolute inset-0 h-full w-full cursor-pointer opacity-0" type="radio" name={name} value="false" defaultChecked={!defaultValue} />
          <span className="block font-semibold">{falseLabel}</span>
          {falseDescription ? <span className={descriptionClass}>{falseDescription}</span> : null}
        </label>
      </div>
    </fieldset>
  );
}
