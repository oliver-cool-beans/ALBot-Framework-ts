
import { BankInfo, IPosition, ItemData, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'
import { bankItems, withdrawBank } from '../helpers/index.js'

export default class UpgradeBankItems extends Task {
  bankingPosition: IPosition
  levelCap: number
  itemCountBuffer: number
  savedItems: Array<ItemData>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.bankingPosition = { map: 'bank', x: 0, y: -200 }
    this.levelCap = 9
    this.itemCountBuffer = args.itemCountBuffer || 1
    this.savedItems = []
  }

  countAllInBank (bank: BankInfo, item: ItemData): number {
    const allItems = Object.values(bank).map((slotData) => slotData).flat()
    return allItems.filter((bankItem: ItemData | number | undefined) => {
      if (typeof bankItem === 'number') return false
      return item && bankItem && bankItem.name === item.name && bankItem.level === item.level
    }).length
  }

  removeBuffer (bank: BankInfo): BankInfo {
    const countItemsAboveLevel = (item: ItemData): number => {
      const allItems = Object.values(bank).map((slotData) => slotData).flat()
      return allItems.filter((bankItem: ItemData | number | undefined) => {
        if (typeof bankItem === 'number' || !bankItem || bankItem.level === undefined || item.level === undefined) return null
        return bankItem && bankItem.name === item.name && bankItem.level > item.level
      }).length
    }
    const findSavedItem = (item: ItemData): ItemData | undefined => {
      return this.savedItems.find((savedItem) => savedItem && savedItem.name === item.name && savedItem.level === item.level)
    }

    return Object.entries(bank).reduce((bankData, [slotName, slotItems]) => {
      if (typeof slotItems === 'number') return bankData

      bankData[slotName] = slotItems.map((item: ItemData) => {
        if (item?.name) {
          console.log('evaluating', item, this.countAllInBank(bank, item), countItemsAboveLevel(item))
        }
        if (this.countAllInBank(bank, item) > 1 && !countItemsAboveLevel(item) && !findSavedItem(item)) {
          this.savedItems.push(item)
          return null
        }
        if (this.countAllInBank(bank, item) >= 1 && (countItemsAboveLevel(item) || findSavedItem(item))) {
          return item
        }
        if (this.countAllInBank(bank, item) > 1 && !countItemsAboveLevel(item)) {
          return item
        }
        return null
      })

      return bankData
    }, {} as BankInfo)
  }

  isValidUpgradeable (item: ItemData): boolean {
    if (!item || item.level === undefined) return false
    return this.bot.AL.Game.G.items[item.name]?.upgrade &&
    item.level < this.levelCap &&
    !item.l
  }

  findUpgradeableItems (bank: BankInfo): BankInfo {
    return Object.entries(bank).reduce((bankData, [slotName, slotItems]) => {
      if (slotName === 'gold') return bankData
      if (typeof slotItems === 'number') return bankData
      bankData[slotName] = slotItems.map((item: ItemData) => this.isValidUpgradeable(item) && item)
      return bankData
    }, {} as BankInfo)
  }

  async loop (): Promise<void> {
    const character = this.bot.character
    await this.bot.easyMove(this.bankingPosition).catch(() => {})
    if (!character.bank) return

    if (character.gold < this.bot.goldToHold) {
      await this.bot.character.withdrawGold(this.bot.goldToHold - character.gold)
    }

    // Get all upgradeable items
    let upgradeableItems = this.findUpgradeableItems(character.bank)
    // Of these upgradeable items, get any within the buffer amount
    upgradeableItems = this.removeBuffer(upgradeableItems)
    if (!Object.values(upgradeableItems).flat().filter(Boolean).length) {
      return await this.removeFromQueue()
    }

    await withdrawBank(this.bot, upgradeableItems)
    await this.bot.easyMove('newupgrade').catch(() => {})

    const upgradeableFlattened = Object.values(upgradeableItems).flat().filter(Boolean)

    let item: ItemData
    let requiredScroll: string
    let scrollPosition: number
    for (const i in character.items) {
      item = character.items[i]
      if (!item) continue
      if (!upgradeableFlattened.find((validItem) => typeof validItem !== 'number' && validItem.name === item.name && validItem.level === item.level)) {
        continue
      }
      requiredScroll = `scroll${character.calculateItemGrade(item)}`
      scrollPosition = character.locateItem(requiredScroll)

      if (scrollPosition === undefined && !character.canBuy(requiredScroll)) {
        continue
      }

      if (scrollPosition === undefined) {
        await character.buy(requiredScroll)
      }
      scrollPosition = character.locateItem(requiredScroll)
      if (scrollPosition === undefined) continue

      this.bot.logger.info(`${this.bot.name} upgrading ${JSON.stringify(item)}`)
      await character.upgrade(i, scrollPosition)
    }

    await this.bot.easyMove(this.bankingPosition).catch(() => {})
    await bankItems(this.bot, this.bot.itemsToHold)
  }
}
