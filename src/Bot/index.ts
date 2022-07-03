import { botConfig, BotParams, Strategies } from '../types/index.js'
import Queue from '../Queue/index.js'
import Party from '../Party/index.js'
import LoopHandler from '../LoopHandler/index.js'
import loops from '../LoopHandler/loops/index.js'
import mage from './mage/index.js'
import merchant from './merchant/index.js'
import { Entity, IPosition, ItemName, MapName, NPCName, ServerIdentifier, ServerRegion, SmartMoveOptions } from 'alclient'
import { attackStrategies, defenceStrategies, moveStrategies } from '../strategies/index.js'

const characterFunctions: any = { mage, merchant }

export default class Bot {
  state: 'stopped' | 'running' | 'errored' | 'connecting' | 'disconnecting'
  config: botConfig
  logger: any
  AL: any
  class: string
  name: string
  defaultRegionName: ServerRegion
  defaultRegionIdentifier: ServerIdentifier
  character: { [key: string]: any }
  loopHandler: LoopHandler
  party: Party
  queue: Queue
  discord: any
  loopOverrideList? : Array<string>
  monster: string
  elixirs: Array<string>
  strategies: Strategies
  target: any
  itemsToHold: Array<ItemName>
  goldToHold: number
  constructor (params: BotParams) {
    this.state = 'stopped'
    this.config = params.config
    this.logger = params.logger
    this.class = params.characterClass
    this.name = params.characterName
    this.monster = params.monster
    this.defaultRegionName = params.defaultRegionName
    this.defaultRegionIdentifier = params.defaultRegionIdentifier
    this.party = params.party
    this.AL = null
    this.character = {}
    this.queue = new Queue(this.logger)
    this.loopHandler = new LoopHandler(this, loops)
    this.discord = null
    this.elixirs = []
    this.strategies = { move: moveStrategies, attack: attackStrategies, defence: defenceStrategies }
    this.itemsToHold = []
    this.goldToHold = 1000000
  }

  private async logInBot (region: string, identifier: string): Promise<any> {
    if (!this.AL) return Promise.reject(new Error('Failed to find AL when starting character'))
    const classFunctionName = `start${this.class.toLowerCase().charAt(0).toUpperCase()}${this.class.slice(1)}`

    this.state = 'connecting'

    // Start the character class from ALClient eg startWarrior
    return await this.AL.Game[classFunctionName](this.name, region, identifier).catch(async (error: any) => {
      const waitTime = error.match(/_(.*?)_/)?.[1]
      if (!waitTime) return Promise.reject(error)
      this.logger.warn(`Timeout detected, waiting, ${parseInt(waitTime)} seconds`)
      await this.wait(waitTime)
      return await this.AL.Game[classFunctionName](this.name, region, identifier).catch((error: any) => Promise.reject(new Error(error)))
    })
  }

  private createListeners (): void {
    this.character.socket.on('request', (data) => this.acceptPartyRequest(data))
    this.character.socket.on('magiport', (data) => this.acceptMagiportRequest(data))
    this.character.socket.on('hit', async (data) => this.avoidStack(data))
  }

  private async avoidStack (data): Promise<void> {
    if (data.id !== this.character.id || !data.stacked) return // Not our character
    if (!data.stacked.includes(this.character.id)) return // We're not the ones that are stacked

    const x = -25 + Math.round(50 * Math.random())
    const y = -25 + Math.round(50 * Math.random())
    await this.character.move(this.character.x + x, this.character.y + y).catch(() => {})
  }

  private async acceptPartyRequest (data): Promise<boolean> {
    if (!this.party.findMemberByName(data.name)) return false
    this.logger.info(`${this.name} Accepting party from ${data.name}`)
    this.character.acceptPartyRequest(data.name).catch(() => {})
    return true
  }

  private async acceptMagiportRequest (data): Promise<boolean> {
    if (!this.party.findMemberByName(data.name)) return false
    this.character.stopSmartMove().catch(() => {})
    this.logger.info(`${this.name} Accepting magiport from ${data.name}`)
    this.character.acceptMagiport(data.name).catch(async () => {
      await this.wait(2) // Retry once
      this.character.acceptMagiport(data.name).catch(() => {})
    })
    return true
  }

  async start (AL: any, region: string = this.defaultRegionName, identifier: string = this.defaultRegionIdentifier) {
    this.logger.info(`Starting ${this.name}`)
    if (!AL) return Promise.reject(new Error('Missing AL Client'))
    this.AL = AL

    if (characterFunctions[this.class]?.preLoad) {
      this.logger.info(`Running PreLoad functions for ${this.name}`)
      await characterFunctions[this.class].preLoad(this).catch((error: Error) => {
        this.logger.error(`Failed to run perload functions for ${this.name} - ${error}`)
      })
    }

    try {
      this.logger.info(`Logging in ${this.name}`)
      this.character = await this.logInBot(region, identifier)
    } catch (error) {
      this.logger.error(`Error starting character ${this.name} - ${error}`)
    }

    if (characterFunctions[this.class]?.load) {
      this.logger.info(`Running Load functions for ${this.name}`)
      await characterFunctions[this.class].load(this).catch((error: Error) => {
        this.logger.error(`Failed to run load functions for ${this.name} - ${error}`)
      })
    }

    this.logger.info(`${this.name} finished starting!`)

    if (!this.character.ready) {
      this.logger.info(`${this.name} Attempting to connect not ready, waiting 10s`)
      await this.wait(10)
      if (!this.character.ready) {
        this.logger.info(`${this.name} Attempting to connect, still not ready, attempting reconnect`)
        await this.disconnect()
        await this.start(this.AL)
      }
    }
  }

  async run (party: any, discord: any) {
    if (discord) this.discord = discord
    if (party && !this.party) this.party = party

    if (this.state === 'running') return Promise.resolve('Already Running')
    this.state = 'running'
    this.createListeners()
    this.loopHandler.start()
  }

  async disconnect (): Promise<void> {
    this.state = 'disconnecting'

    this.logger.info(`${this.name} disconnecting, waiting for all loops to finish`)
    await this.loopHandler.stopAll()

    if (!this.character?.socket) return

    this.character.disconnect()
    this.character = {}
    await this.wait(5)
    this.logger.info(`${this.name} finished disconnecting!`)
    return Promise.resolve()
  }

  async reconnect (region?: ServerRegion, identifier?: ServerIdentifier): Promise<void> {
    await this.disconnect()
    this.logger.info(`${this.name} Reconnecting -> Disconnected, waiting 5 seconds then reconnecting`)
    try {
      await this.start(this.AL, region, identifier)
      await this.run(this.party, this.discord)
    } catch (error) {
      this.logger.error(`${this.name} failed to reconnect - ${error}`)
    }
  }

  async wait (time: number): Promise<void> {
    return await new Promise(resolve => setTimeout(resolve, time * 1000))
  }

  async easyMove (to: IPosition | ItemName | MapName | string | NPCName, options: SmartMoveOptions = {}): Promise<IPosition> {
    if (this.character.ctype === 'mage') options.useBlink = true
    if (this.character.stand) await this.character.closeMerchantStand()
    return await this.character.smartMove(to, options)
  }

  isReadyToEngage (): Boolean {
    if ((this.character.hp / this.character.max_hp) * 100 <= 80) return false
    if ((this.character.mp / this.character.max_mp) * 100 <= 30) return false
    return true
  }

  attackingMe (): Array<Entity> {
    return [...this.character.entities.values()]?.filter((target) => {
      return target.target === this.character.id
    })
  }

  isLowHp (): Boolean {
    return (this.character.hp / this.character.max_hp) * 100 <= 30
  }

  setTarget (target: string | null): void {
    this.target = target
  }

  getServerIdentifier (): ServerIdentifier {
    return this.character?.serverData?.name
  }

  getServerRegion (): ServerRegion {
    return this.character?.serverData?.region
  }

  /* async checkBankFor (items: Array<string>): Promise<{[key: string]: number}> {
    const bankData = this.character.bank
    if (!bankData) return {}
    delete bankData.gold
    const foundItems = Object.values(bankData).flat().reduce((itemArray, item) => {
      if (item && items.includes(item.name)) {
        itemArray[item.name] = (itemArray[item.name] || 0) + (item.q || 1)
      }
      return itemArray
    }, {})
    return foundItems
  } */
}
