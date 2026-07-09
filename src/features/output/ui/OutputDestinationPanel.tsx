import type { OutputDestination } from '../application/output-destination';

type OutputDestinationPanelProps = {
  readonly destination: OutputDestination;
  readonly supportsFolderSelection: boolean;
  readonly error: string | undefined;
  readonly onChooseDestination: () => void;
};

export function OutputDestinationPanel({
  destination,
  supportsFolderSelection,
  error,
  onChooseDestination,
}: OutputDestinationPanelProps) {
  const needsFolderSelection =
    destination.type === 'directory' && destination.name === 'No folder selected';

  return (
    <section className="panel setup-panel" aria-labelledby="output-destination-title">
      <h2 id="output-destination-title">destination</h2>
      <p className="setting-value">{destination.name.toLowerCase()}</p>
      {needsFolderSelection ? (
        <p id="output-destination-guidance" className="control-guidance">
          folder required
        </p>
      ) : null}
      {supportsFolderSelection ? (
        <button
          className="secondary-action"
          type="button"
          onClick={onChooseDestination}
          aria-describedby={needsFolderSelection ? 'output-destination-guidance' : undefined}
        >
          choose folder
        </button>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
