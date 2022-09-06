
import { IPosition, ItemName, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'

export default class SellInStand extends Task {
  standPosition: IPosition
  itemsToSell: Array<{name: ItemName, level: number, q: number, price: number}>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.standPosition = { map: 'main', x: 180.821266 + (Math.random() * 100), y: -66.94612 }
    this.itemsToSell = args.itemsToSell || []
  }

  async loop (): Promise<void> {
    if (this.bot.character.stand) return
    await this.bot.character.closeMerchantStand()
    if (this.bot.character.ctype !== 'merchant') return this.removeFromQueue()
    await this.bot.easyMove(this.standPosition).catch(() => {})
    await this.bot.character.openMerchantStand()
    await this.listItemsForSale()
  }

  private async listItemsForSale () {
    let itemData
    let itemToSell
    for (const i in this.bot.character.items) {
      itemData = this.bot.character.items[i]
      if (!itemData) continue
      itemToSell = this.itemsToSell.find((item) => item.name === itemData.name && item.level === itemData.level)
      if (itemToSell) {
        console.log('listing for sale', itemToSell)
        await this.bot.character.listForSale(i, itemToSell.price, null, itemData.q || 1).catch((error) => {
          console.log('There was an issue listing item', itemData.name, error)
        })
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait
      }
    }
  }
}
