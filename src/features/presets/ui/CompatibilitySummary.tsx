import type { CompatibilityValidation } from '../domain/compatibility-validation';

type CompatibilitySummaryProps = {
  readonly validations: readonly CompatibilityValidation[];
};

export function CompatibilitySummary({ validations }: CompatibilitySummaryProps) {
  const warningCount = validations.reduce(
    (total, validation) => total + validation.warnings.length,
    0,
  );

  if (validations.length === 0) {
    return null;
  }

  return (
    <details className="disclosure-panel">
      <summary id="compatibility-title">
        <span>compatibility</span>
        <span>{warningCount}</span>
      </summary>

      <ul className="detail-list" aria-label="compatibility warnings">
        {validations.map((validation) => (
          <li key={validation.inspection.assetId}>
            <strong>{validation.inspection.container ?? 'unknown'}</strong>
            {validation.warnings.length > 0 ? (
              <span>{validation.warnings.map((warning) => warning.message).join(' ')}</span>
            ) : (
              <span>no warnings</span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
