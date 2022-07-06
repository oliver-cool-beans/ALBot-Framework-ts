
import { IPosition, ItemData, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'
import { bankItems, findWithdrawBank } from '../helpers/index.js'

export default class FindAndExchange extends Task {
  itemsToExchange: Array<ItemData>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.itemsToExchange = this.bot.config.itemsToExchange
  }

  async exchangeSingle (itemData): Promise<any> {
    const { character } = this.bot
    if (!character.canExchange(itemData.name)) return Promise.reject(new Error(`Can't exchange item ${itemData.name}`))

    const itemLoc = character.locateItem(itemData.name, character.items)
    itemData = character.items[itemLoc]
    if (!itemLoc && itemLoc !== 0) return Promise.reject(new Error(`Can't exchange item - no item location for ${itemData.name}`))

    while (character.q.exchange) {
      this.bot.logger.info(`${this.bot.name} is currently exchanging, waiting a bit... (1s)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    await character.exchange(itemLoc).catch((error) => {
      this.bot.logger.error(`${this.bot.name} error exchanging ${error}`)
    })

    return await new Promise(resolve => setTimeout(resolve, 4000))
  }

  async exchangeStack (itemData, exchangeLimit) {
    const { character } = this.bot
    while (itemData.q >= exchangeLimit) { // Only exchange 10 at a time so we don't flood our inventory and bank
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (!character.canExchange(itemData.name)) break

      const itemLoc = character.locateItem(itemData.name, character.items)
      itemData = character.items[itemLoc]
      if (!itemLoc && itemLoc !== 0) break
      this.bot.logger.info(`${this.bot.name} qty remaining ${itemData.q}, limit: ${exchangeLimit}`)
      this.bot.logger.info(`${this.bot.name} Exchanging ${itemData.name}, in slot ${itemLoc}`)

      if (character.q.exchange) continue
      await character.exchange(itemLoc).catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed exchange ${error}`)
      })
    }
  }

  async loop (): Promise<any> {
    const { character } = this.bot
    if (character.esize <= 0) return this.removeFromQueue()

    for (const item in this.itemsToExchange) {
      await this.bot.easyMove({ map: 'bank', x: 0, y: -200 })
      await bankItems(this.bot, this.bot.itemsToHold)

      if (character.esize <= 0) return Promise.resolve('Inventory full')

      const itemName = this.itemsToExchange[item].name || this.itemsToExchange[item]
      let itemData: ItemData, exchangeLocation: IPosition
      let exchangeLimit: number = 0
      const gItem = character.G.items[itemName]

      await findWithdrawBank(this.bot, [this.itemsToExchange[item]])

      for (const i in character.items) {
        itemData = character.items[i]

        if (!itemData) continue
        if (itemData.name !== itemName) continue

        if ((!gItem.upgrade && !gItem.compound) && gItem.e && (itemData.q || 1) < gItem.e) continue

        exchangeLimit = gItem.e ? (itemData.q || 1) - (gItem.e * 10) : (itemData.q || 1) - 10
        if (exchangeLimit < 0) exchangeLimit = gItem.e || itemData.q

        if (this.itemsToExchange.find((item) => item.name === itemData.name && item.level === itemData.level)) {
          exchangeLocation = this.bot.AL.Pathfinder.locateExchangeNPC(itemData.name)
          this.bot.logger.info(`${this.bot.name} exchange location for ${itemData.name} is ${JSON.stringify(exchangeLocation)}`)
          if (!exchangeLocation) continue
          await character.smartMove(exchangeLocation).catch(() => {})
          if (!character.canExchange(itemData.name)) {
            this.bot.logger.warn(`${this.bot.name} is not ready to exchange`)
          };

          try {
            if (gItem.compound || gItem.upgrade) {
              this.bot.logger.info(`${this.bot.name} single exchanging ${itemData.name}`)
              await this.exchangeSingle(itemData)
              continue
            }
            this.bot.logger.info(`${this.bot.name} stack exchanging ${itemData.name}`)
            await this.exchangeStack(itemData, exchangeLimit)
          } catch (error) {
            this.bot.logger.error(`${this.bot.name} error exchanging ${error}`)
          }
        }
      }
    }

    await this.removeFromQueue()
  }
}
