import { createLogger, transports, format } from 'winston'
import { consoleFormat } from 'winston-console-format'

export default function winstonLogger () {
  return createLogger({
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize({ all: true }),
          format.padLevels(),
          consoleFormat({
            showMeta: true,
            metaStrip: ['timestamp', 'service'],
            inspectOptions: {
              depth: Infinity,
              colors: true,
              maxArrayLength: Infinity,
              breakLength: 120,
              compact: Infinity
            }
          })
        )
      })
    ]
  })
}
