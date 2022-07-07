import { loop as loopType } from '../../types/index.js'
import Bot from '../../Bot/index.js'
import { Entity } from 'alclient'

export default class Loop implements loopType {
  status: 'started' | 'running' | 'stopping' | 'stopped'
  strategy: any
  bot: Bot
  loopFunction: Promise<void> | undefined
  timeout: number
  constructor (Bot: Bot) {
    this.status = 'stopped'
    this.timeout = 1
    this.bot = Bot
    this.strategy = {}
    this.loopFunction = undefined
  }

  start (): void {
    this.bot.logger.info(`${this.bot.name} starting loop ${this.constructor.name}`)
    this.status = 'started'
    this.loopFunction = this.run()
  }

  private async run (): Promise<void> {
    this.status = 'running'
    while (this.status === 'running') {
      if (!this.bot.character?.ready) {
        this.bot.logger.warn(`${this.bot.name} exiting loop ${this.constructor.name} - Character not ready`)
        return
      }
      await this.loop().catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run loop ${this.constructor.name} - ${error}`)
      })
      await this.bot.wait(this.timeout) // Loop timeout in seconds
    }
  }

  async stop (): Promise<void> {
    this.status = 'stopping'
    await this.loopFunction
    this.status = 'stopped'
    this.bot.logger.info(`${this.bot.name} stopped loop ${this.constructor.name}`)
  }

  private getStrategyName (monsterName: string, strategyType, ctype: string): string {
    return this.bot?.config?.monsters?.strategies?.[ctype]?.[monsterName]?.[strategyType] ||
    this.bot?.config?.monsters?.strategies?.default?.[monsterName]?.[strategyType]
  }

  setStrategy (targetData: Entity, strategyType: string): void {
    if (!targetData?.type) return
    const strategyName = this.getStrategyName(targetData.type, strategyType, this.bot.character.ctype)
    if (strategyName) {
      if (this.strategy.name !== strategyName) {
        const StrategyClass = this.bot.strategies[strategyType][strategyName]
        const MoveStrategy = new StrategyClass(this.bot, targetData)
        this.strategy = { name: strategyName, func: MoveStrategy }
      }
    } else {
      this.strategy = {}
    }
  }

  async loop () { return Promise.resolve() }
}
