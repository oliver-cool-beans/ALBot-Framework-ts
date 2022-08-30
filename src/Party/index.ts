import { Entity, MapName } from 'alclient'
import Bot from '../Bot/index.js'
import DataPool from './DataPool.js'
import Companion from 'al-companion-sdk'

export default class Party {
  members: Array<Bot>
  allBots: Array<Bot>
  config: any
  dataPool: DataPool
  companion: Companion
  constructor (characters = [], config = {}, logger) {
    this.members = []
    this.allBots = characters
    this.config = config
    this.dataPool = new DataPool(this)
    this.companion = new Companion(process.env.COMPANION_USERNAME, process.env.COMPANION_PASSWORD)
    this.companion.login()
  }

  private getCorrectServer (member: Bot) {
    if (!member.character?.serverData) return {}
    const runningTask = member.queue.getRunningTask() || {}
    return {
      serverRegion: runningTask.serverRegion || member.defaultRegionName,
      serverIdentifier: runningTask.serverIdentifier || member.defaultRegionIdentifier
    }
  }

  private hasDisconnected (member: Bot): boolean {
    return !member.character?.ready || !member.character?.socket || member.character?.disconnected || !member.AL
  }

  private isOnCorrectServer (member: Bot): boolean {
    const { serverRegion, serverIdentifier } = this.getCorrectServer(member)
    const { region: currentServerRegion, name: currentServerIdentifier } = member.character.serverData

    if (serverRegion === currentServerRegion && serverIdentifier === currentServerIdentifier) return true
    return false
  }

  async companionLoop (): Promise<void> {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await Promise.all(this.members.map(async (member) => {
        if (!member.character?.name) return
        const payload = this.companion.formatCharacterPayload(member.character)
        const tasks = member.queue.getQueue()
        const runningtask = member.queue.getRunningTask()
        payload.custom_fields = {
          taskCount: member.queue.getQueueSize(),
          runningTask: runningtask?.constructor.name || null,
          tasks: tasks.map((task) => task.constructor.name) || []
        }
        await this.companion.updateCharacter(payload).catch((error) => {
          member.logger.error(`${member.name} failed to upload to companion - ${error}`)
        })
      }))
    }
  }

  async reconnectMemberLoop (): Promise<boolean> {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await Promise.all(this.members.map(async (member) => {
        if (['connecting', 'stopped'].includes(member.state)) return Promise.resolve(false)
        if (this.hasDisconnected(member) || !this.isOnCorrectServer(member)) {
          member.logger.info(`${member.name} has disconnected, reconnecting now!`)
          const { serverRegion, serverIdentifier } = this.getCorrectServer(member)
          await member.reconnect(serverRegion, serverIdentifier)
          return Promise.resolve(true)
        }
      }))
    }
  }

  addMember (characterName: string) {
    const character = this.allBots.find((char) => characterName === char.name)
    if (!this.members.find((char) => characterName === char.name) && character) {
      this.members.push(character)
    }
  }

  removeMember (characterName: string) {
    this.members = this.members.filter((member) => member.name !== characterName)
  }

  findMemberByName (name: string): Bot | undefined {
    return this.members.find((member) => member.name === name)
  }

  findMemberById (id: string): Bot | undefined {
    return this.members.find((member) => member.character.id === id)
  }

  partyInSameMap (map: MapName): Boolean {
    return this.members.every((member) => member.character.ctype === 'merchant' || member.character.map === map)
  }

  async disconnect () {
    return Promise.all(this.members.map(async (member) => {
      return member.disconnect()
    }))
  }

  async start (AL): Promise<void> {
    this.dataPool.start()
    this.reconnectMemberLoop()
    if (!this.config.disableCompanion) this.companionLoop()
    await Promise.all(this.members.map(async (member, index: number) => {
      member.start(AL).then(() => member.run(this, null))
    }))
  }

  findMemberWithTarget (target: string): Entity | null {
    const memberWithTarget = this.members.find((member) => member?.target === target && member?.character.entities.get(target))
    return memberWithTarget ? memberWithTarget.character.entities.get(target) : null
  }
}
