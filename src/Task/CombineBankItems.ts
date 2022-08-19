
import { BankInfo, IPosition, ItemData, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'
import { bankItems, withdrawBank } from '../helpers/index.js'

export default class CombineBankItems extends Task {
  bankingPosition: IPosition
  levelCap: number
  itemCountBuffer: number
  savedItems: Array<ItemData>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.bankingPosition = { map: 'bank', x: 0, y: -200 }
    this.levelCap = 4
    this.itemCountBuffer = 3 + args.itemCountBuffer || 1 // 3 required + X additional item as buffer
    this.savedItems = []
  }

  countAllInBank (bank: BankInfo, item: ItemData): number {
    const allItems = Object.values(bank).map((slotData) => slotData).flat()
    return allItems.filter((bankItem: ItemData | undefined | number) => {
      if (typeof bankItem === 'number') return null
      return item && bankItem && bankItem.name === item.name && bankItem.level === item.level
    }).length
  }

  removeExtras (bank: BankInfo): BankInfo {
    return Object.entries(bank).reduce((bankData, [slotName, slotItems]) => {
      if (typeof slotItems === 'number') return bankData
      // Check if divisible by 3, and remove extras
      bankData[slotName] = slotItems.reduce((slotData: Array<ItemData | null>, item: ItemData) => {
        if (typeof item === 'number') return slotData
        // The total count in the bank before processing
        const masterBankCount = this.countAllInBank(bank, item)
        // The count of item in the process bankData so far
        const filteredBankCount = this.countAllInBank(bankData, item)
        // The count of item in this current bank slot
        const slotCount = slotData.filter((slotItem: ItemData | null) => {
          return item && slotItem && slotItem.name === item.name && slotItem.level === item.level
        }).length
        const maxCompoundableCount = masterBankCount - masterBankCount % 3 // The total count of items that be matched to compounds
        if (filteredBankCount + slotCount < maxCompoundableCount) {
          slotData.push(item)
        } else {
          slotData.push(null)
        }
        return slotData
      }, [])
      return bankData
    }, {} as BankInfo)
  }

  removeBuffer (bank: BankInfo): BankInfo {
    const countItemsAboveLevel = (item: ItemData): number => {
      const allItems = Object.values(bank).map((slotData) => slotData).flat()
      return allItems.filter((bankItem: ItemData | undefined | number) => {
        if (typeof bankItem === 'number' || !bankItem || bankItem.level === undefined || item.level === undefined) return null
        return bankItem && bankItem.name === item.name && bankItem.level > item.level
      }).length
    }
    const findSavedItem = (item: ItemData | undefined): ItemData | undefined => {
      return this.savedItems.find((savedItem: ItemData | undefined) => {
        return item && savedItem && savedItem.name === item.name && savedItem.level === item.level
      })
    }

    return Object.entries(bank).reduce((bankData, [slotName, slotItems]) => {
      if (typeof slotItems === 'number') return bankData

      bankData[slotName] = slotItems.map((item: ItemData) => {
        if (this.countAllInBank(bank, item) > 3 && !countItemsAboveLevel(item) && !findSavedItem(item)) {
          this.savedItems.push(item)
          return null
        }
        if (this.countAllInBank(bank, item) >= 3 && (countItemsAboveLevel(item) || findSavedItem(item))) {
          return item
        }
        if (this.countAllInBank(bank, item) > 3 && !countItemsAboveLevel(item)) {
          return item
        }
        return null
      })

      return bankData
    }, {} as BankInfo)
  }

  isValidCompoundable (item: ItemData): boolean {
    if (!item || item.level === undefined) return false
    return this.bot.AL.Game.G.items[item.name]?.compound &&
    item.level < this.levelCap &&
    !item.l
  }

  findCombinableItems (bank: BankInfo): BankInfo {
    return Object.entries(bank).reduce((bankData, [slotName, slotItems]) => {
      if (slotName === 'gold') return bankData
      if (typeof slotItems === 'number') return bankData
      bankData[slotName] = slotItems.map((item: ItemData) => this.isValidCompoundable(item) && item)
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

    // Get all combinable items
    let combinableItems = this.findCombinableItems(character.bank)
    // Of these combinable items, get any within the buffer amount
    combinableItems = this.removeBuffer(combinableItems)
    combinableItems = this.removeExtras(combinableItems)
    if (!Object.values(combinableItems).flat().filter(Boolean).length) {
      return await this.removeFromQueue()
    }

    await withdrawBank(this.bot, combinableItems)
    await this.bot.easyMove('newupgrade').catch(() => {})

    const combinableFlattened = Object.values(combinableItems).flat().filter(Boolean)

    let item: ItemData
    let requiredScroll: string
    let scrollPosition: number
    let itemArray: Array<ItemData>
    for (const i in character.items) {
      item = character.items[i]
      if (!item || item.level === undefined) continue
      if (!combinableFlattened.find((validItem) => typeof validItem !== 'number' && validItem.name === item.name && validItem.level === item.level)) {
        continue
      }
      itemArray = character.locateItemsByLevel(character.items, { excludeLockedItems: true })?.[item.name]?.[item.level]?.slice(0, 3)
      if (!itemArray.length) continue

      requiredScroll = `cscroll${character.calculateItemGrade(item)}`
      scrollPosition = character.locateItem(requiredScroll)
      if (scrollPosition === undefined && !character.canBuy(requiredScroll)) continue

      if (scrollPosition === undefined) {
        await character.buy(requiredScroll).catch(() => {})
      }
      scrollPosition = character.locateItem(requiredScroll)
      if (scrollPosition === undefined) continue

      this.bot.logger.info(`${this.bot.name} compounding ${JSON.stringify(itemArray[0])} ${JSON.stringify(itemArray[1])} ${JSON.stringify(itemArray[2])}`)
      await character.compound(itemArray[0], itemArray[1], itemArray[2], scrollPosition)
    }

    await this.bot.easyMove(this.bankingPosition).catch(() => {})
    await bankItems(this.bot, this.bot.itemsToHold)
  }
}
