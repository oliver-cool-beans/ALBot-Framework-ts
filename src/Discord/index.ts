import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client, Intents } from 'discord.js'

import Bot from '../Bot/index.js'
import Party from '../Party/index.js'
import { create as characterCommands, interact as characterInteract } from './commands/character.js'

export class Discord {
  client: any
  rest: any
  commands: any
  characters: Array<Bot>
  party: Party
  logger: any
  AL: any
  credentials: {token: string, clientId: string, guildId: string}
  constructor (credentials: {token: string, clientId: string, guildId: string}, characters: Array<Bot>, party: Party, logger: any, AL: any) {
    this.client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    this.credentials = credentials
    this.rest = new REST({ version: '9' }).setToken(credentials.token)
    this.characters = characters
    this.party = party
    this.logger = logger
    this.AL = AL
    this.commands = {
      character: { commands: characterCommands(), interact: characterInteract }
    }

    try {
      this.createCommands()
      this.startListener()
    } catch (error) {
      console.log('Failed to connect to discord!', error)
    }
    this.client.login(credentials.token)
  }

  startListener (): void {
    console.log('Starting discord client')
    this.client.on('ready', () => {
      console.log(`Discord Logged in as ${this.client.user.tag}!`)
    })
    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return
      if (!this.commands[interaction.commandName]) return
      await interaction.deferReply()
      return this.commands[interaction.commandName].interact(interaction, this.characters, this.AL)
    })
  }

  async createCommands (): Promise<void> {
    const commands = Object.values(this.commands).map((comm: any) => comm.commands)
    await this.rest.put(
      Routes.applicationGuildCommands(this.credentials.clientId, this.credentials.guildId),
      { body: commands }
    )
  }
}
