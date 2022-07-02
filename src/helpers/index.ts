import AL, { BankInfo, IPosition, ItemData, ItemName, MonsterName } from 'alclient'
import Bot from '../Bot/index.js'
import monsters from '../monsters/index.js'

export function calculatePotionItems (characterLevel: number): {hpot: string, mpot: string} {
  const level = characterLevel < 30 ? 0 : 1
  return {
    hpot: `hpot${level}`,
    mpot: `mpot${level}`
  }
}

export function sortClosestDistance (to: any) {
  return (a: IPosition, b: IPosition) => {
    const distanceA = AL.Tools.distance(to, a)
    const distanceB = AL.Tools.distance(to, b)
    return distanceA - distanceB
  }
}

export function getMonsterHandlerName (monsterName: MonsterName): string {
  return monsters[monsterName] ? monsterName : 'DefaultMonsterHandler'
}

export async function bankItems (bot: Bot, itemsToHold: Array<ItemName>): Promise<void> {
  const character = bot.character
  for (let i = 0; i < character.isize; i++) {
    const item = character.items[i]
    if (!item) continue // No item in this slot
    if (item.l === 'l') continue // Don't send locked items
    if (itemsToHold.includes(item.name)) continue
    try {
      await character.depositItem(i)
    } catch (e) {
      bot.logger.error(e)
    }
    await bot.wait(1)
  }
}

export async function withdrawBank (bot, bank: BankInfo) {
  const character = bot.character
  for (const slotName in bank) {
    for (const i in bank[slotName]) {
      if (!bank[slotName][i]) continue
      bot.logger.info(`${bot.name} withdrawing ${bank[slotName][i].name} from slot ${slotName} index ${i}`)
      await character.withdrawItem(slotName, i, character.getFirstEmptyInventorySlot())
      await bot.wait(0.25)
    }
  }
}

export async function findWithdrawBank (bot: Bot, items: Array<ItemData>): Promise<void> {
  const character = bot.character
  if (!character.bank || Object.keys(character.bank).length <= 0) {
    while (!character.bank) {
      bot.logger.info(`${bot.name} waiting for bank items to populate`)
      bot.wait(0.25)
    }
  }

  const bank: BankInfo = character.bank
  type bankMapping = Array<{ index: number, slot: string, item: ItemData }>
  const bankWithdrawMap: bankMapping = []
  Object.entries(bank).forEach(([slotName, slotItems]) => {
    if (slotName === 'gold') return
    if (typeof slotItems === 'number') return
    slotItems.forEach((item: ItemData, itemIndex: number) => {
      if (!item) return
      const wItemData: ItemData | undefined = items.find((wItem: ItemData) => wItem.name === item.name && wItem.level === item.level)
      if (!wItemData) return false
      const qtyWithdrawn: number = bankWithdrawMap.filter((mapping) => mapping.item.name === item.name && mapping.item.level === item.level).length
      if (qtyWithdrawn > (wItemData.q || 999)) return false
      bankWithdrawMap.push({ index: itemIndex, slot: slotName, item })
    })
  })

  for (const i in bankWithdrawMap) {
    bot.logger.info(`${bot.name} withdrawing ${bankWithdrawMap[i]}`)
    await character.withdrawItem(bankWithdrawMap[i].slot, bankWithdrawMap[i].index, character.getFirstEmptyInventorySlot())
    await bot.wait(0.25)
  }
}
