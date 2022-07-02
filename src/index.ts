import * as dotenv from 'dotenv'
import AL from 'alclient'
import winstonLogger from './logger/index.js'
import Bot from './Bot/index.js'
import Party from './Party/index.js'
import fs from 'fs'
import { Discord } from './Discord/index.js'

const logger = winstonLogger()

dotenv.config()

async function init (): Promise<void> {
  const { AL_EMAIL, AL_PASSWORD, DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, DEFAULT_MONSTER } = process.env

  let config
  if (fs.existsSync('./config.json')) {
    config = fs.readFileSync('./config.json')
    config = JSON.parse(config)
  }

  logger.info(AL_EMAIL)

  if (!AL_EMAIL || !AL_PASSWORD) return Promise.reject(new Error('AL Credentials not provided'))

  logger.info('Initialising Commander')
  await Promise.all([AL.Game.login(AL_EMAIL, AL_PASSWORD), AL.Game.getGData()]).catch((error) => {
    return Promise.reject(new Error(`Unable to Login to AL CLient: ${error}`))
  })

  await AL.Pathfinder.prepare(AL.Game.G)

  const party = new Party([], config, logger)

  const characters = Object.values(AL.Game.characters).map((char: any, index) => {
    return new Bot({
      characterName: char.name,
      defaultRegionName: 'ASIA',
      defaultRegionIdentifier: 'I',
      characterClass: char.type,
      monster: DEFAULT_MONSTER || 'bee',
      logger,
      config: config || {},
      party
    })
  })

  characters.forEach((char) => {
    party.allBots.push(char)
    char.party = party
  })

  if (DISCORD_TOKEN && DISCORD_CLIENT_ID && DISCORD_GUILD_ID) {
    const discordCredentials = { token: DISCORD_TOKEN, clientId: DISCORD_CLIENT_ID, guildId: DISCORD_GUILD_ID }
    // eslint-disable-next-line no-unused-vars
    const discord = new Discord(discordCredentials, characters, party, logger, AL)
  }

  party.start(AL)

  logger.info(`Found ${characters.length} characters`)
}

init().catch((error) => {
  logger.error(`Error initialising ${error}`)
})
