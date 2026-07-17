import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'

diag.setLogger(new DiagConsoleLogger(), process.env.NODE_ENV === 'production' ? DiagLogLevel.WARN : DiagLogLevel.NONE)

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  metricReaders: [new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
    exportIntervalMillis: 10_000,
  })],
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-http': {
      ignoreIncomingRequestHook: (req) => req.url?.startsWith('/error/') ?? false,
      ignoreOutgoingRequestHook: (req) => {
        const host = (req as { hostname?: string; host?: string }).hostname ?? (req as { host?: string }).host ?? ''
        // Ignore the Loki exporter and any self-calls (trigger endpoints and the
        // traffic simulator both fetch the app itself; those outgoing spans would
        // make synthetic requests distinguishable from organic ones).
        return host.includes('grafana.net') || host === 'localhost' || host === '127.0.0.1' || host === '::1'
      },
    },
    '@opentelemetry/instrumentation-winston': {
      disableLogSending: true,
    },
  })],
})

sdk.start()
