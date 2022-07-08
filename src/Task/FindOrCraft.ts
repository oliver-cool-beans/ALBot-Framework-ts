
import { ItemData, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'
import { findWithdrawBank, findClosestVendor } from '../helpers/index.js'

export default class FindOrCraft extends Task {
  items: Array<ItemData>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.items = args.items || []
  }

  isInInventory (item: ItemData): Boolean {
    return !!this.bot.character.items.find((invItem) => {
      return invItem && invItem.name === item.name && invItem.level === item.level
    })
  }

  async buyItems (itemsToBuy): Promise<any> {
    let item: {qty: number, name: string, closestVendor: string}

    for (const index in itemsToBuy) {
      item = itemsToBuy[index]
      try {
        await this.bot.easyMove(item.closestVendor, { getWithin: this.bot.AL.Constants.NPC_INTERACTION_DISTANCE / 2 })
        console.log('Moved to vendor', item.closestVendor, 'for', item.name)
        if (this.bot.character.canBuy(item.name)) {
          console.log('I AM NOW BUYING', item.name, item.qty)
          await this.bot.character.buy(item.name, item.qty).catch((error) => { console.log('CANNOT BUY', error) })
        }
      } catch (error) {
        console.log(error)
        continue
      }
    }
  }

  hasRequiredInInventory (inventory, requiredItems): Boolean {
    let hasItems = true
    requiredItems.forEach((reqItem) => {
      const invItem = inventory.find((item) => item && item.name === reqItem.name)
      if (!invItem || invItem.qty < reqItem.qty) hasItems = false
    })
    return hasItems
  }

  async loop (): Promise<any> {
    const { character } = this.bot
    const bank = character.bank || character.party.dataPool.data.bank
    if (!bank) return await this.bot.easyMove({ map: 'bank', x: 0, y: -200 })

    await findWithdrawBank(this.bot, this.items)

    const missingItems = this.items.filter((item) => !this.isInInventory(item))

    this.bot.logger.info(`${this.bot.name} is missing these items ${JSON.stringify(missingItems)}`)

    let item: ItemData
    let requiredItems: Array<ItemData>
    let itemsToBuy: Array<ItemData>
    let missingRequiredItems: Array<ItemData>
    let craftCounter: number
    for (const index in missingItems) {
      craftCounter = 0
      requiredItems = []
      itemsToBuy = []
      missingRequiredItems = []
      item = missingItems[index]
      const gCraft = character.G.craft[item.name]

      gCraft.items.forEach((item) => {
        const itemDetails = { qty: item[0], name: item[1], closestVendor: null }
        const closestVendor = findClosestVendor(this.bot, item[1])
        if (closestVendor.npc.id) {
          itemDetails.closestVendor = closestVendor.npc.id
          itemsToBuy.push(itemDetails)
          return
        }
        requiredItems.push(itemDetails)
      })

      await findWithdrawBank(this.bot, requiredItems)
      missingRequiredItems = requiredItems.filter((item) => !this.isInInventory(item))

      if (missingRequiredItems.length) {
        this.bot.logger.warn(`${this.bot.name} skipping crafing ${item.name} - Required items missing ${missingRequiredItems}`)
        continue
      }

      this.bot.logger.info(`${this.bot.name} has all required items to craft ${item.name}`)
      while (this.hasRequiredInInventory(character.items, requiredItems) && craftCounter < (item.q || 1)) {
        await this.buyItems(itemsToBuy)

        await this.bot.easyMove('craftsman', { getWithin: this.bot.AL.Constants.NPC_INTERACTION_DISTANCE / 2 })
        if (character.canCraft(item.name)) {
          this.bot.logger.info(`${this.bot.name} crafting ${item.name}`)
          await character.craft(item.name)
        }
        craftCounter++
      }
    }

    await this.removeFromQueue()
  }
}