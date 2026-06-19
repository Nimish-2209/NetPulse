import ServiceCard from "./ServiceCard";

export default function ServicesPanel({
  busy,
  canMaintain,
  onCreateService,
  onRunCheck,
  selectedServiceId,
  serviceForm,
  services,
  setSelectedServiceId,
  setServiceForm
}) {
  return (
    <section className="panel" id="services">
      <div className="section-heading">
        <h3>Services</h3>
        {busy ? <span className="subtle">Working...</span> : null}
      </div>

      {canMaintain ? (
        <form className="inline-form" onSubmit={onCreateService}>
          <input
            value={serviceForm.name}
            onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
            placeholder="Login API"
            required
          />
          <input
            value={serviceForm.url}
            onChange={(event) => setServiceForm({ ...serviceForm, url: event.target.value })}
            placeholder="https://example.com/health"
            required
          />
          <button className="primary-button" disabled={busy} type="submit">
            Add
          </button>
        </form>
      ) : (
        <p className="permission-note">Viewer access is read-only for services.</p>
      )}

      <div className="service-list">
        {services.length ? (
          services.map((service) => (
            <ServiceCard
              canRunCheck={canMaintain}
              key={service.id}
              service={service}
              selected={service.id === selectedServiceId}
              onRunCheck={onRunCheck}
              onSelect={(nextService) => setSelectedServiceId(nextService.id)}
            />
          ))
        ) : (
          <p className="empty-state">No services.</p>
        )}
      </div>
    </section>
  );
}
