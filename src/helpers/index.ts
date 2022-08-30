import AL, {
  BankInfo, GMap, IPosition, ItemData, ItemName, ServerIdentifier, ServerRegion,
  Mage, Warrior, Rogue, Ranger, Priest, Paladin, Merchant
} from 'alclient'
import Bot from '../Bot/index.js'
import monsters from '../monsters/index.js'

export function getALClientClass (className: string, bot: Bot): Mage | Warrior | Rogue | Ranger | Priest | Paladin | Merchant | undefined {
  const server = bot.AL.Game.servers[bot.defaultRegionName][bot.defaultRegionIdentifier]
  if (className === 'mage') return new Mage(bot.userId, bot.authCode, bot.characterId, bot.AL.Game.G, server)
  if (className === 'warrior') return new Warrior(bot.userId, bot.authCode, bot.characterId, bot.AL.Game.G, server)
  if (className === 'rogue') return new Rogue(bot.userId, bot.authCode, bot.characterId, bot.AL.Game.G, server)
  if (className === 'ranger') return new Ranger(bot.userId, bot.authCode, bot.characterId, bot.AL.Game.G, server)
  if (className === 'priest') return new Priest(bot.userId, bot.authCode, bot.characterId, bot.AL.Game.G, server)
  if (className === 'paladin') return new Paladin(bot.userId, bot.authCode, bot.characterId, bot.AL.Game.G, server)
  if (className === 'merchant') return new Merchant(bot.userId, bot.authCode, bot.characterId, bot.AL.Game.G, server)
}
export function SNtoServerData (serverName: string): {serverIdentifier: ServerIdentifier, serverRegion: ServerRegion} {
  const serverData = serverName.split(' ')
  return { serverIdentifier: serverData[1] as ServerIdentifier, serverRegion: serverData[0] as ServerRegion }
}

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

export function getMonsterHandlerName (monsterName: string): string {
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
    await bot.wait(0.5)
  }
}

export async function withdrawBank (bot: Bot, bank: BankInfo, esizeLimit: number = 0) {
  const character = bot.character
  for (const slotName in bank) {
    for (const i in bank[slotName]) {
      if (!bank[slotName][i]) continue
      if (character.esize <= esizeLimit) continue
      bot.logger.info(`${bot.name} withdrawing ${bank[slotName][i].name} from slot ${slotName} index ${i}`)
      await character.withdrawItem(slotName, i, character.getFirstEmptyInventorySlot()).catch((error) => {
        bot.logger.error(`${bot.name} cannot withdraw ${bank[slotName][i].name} - ${error}`)
      })
      await bot.wait(0.25)
    }
  }
}

export async function findWithdrawBank (bot: Bot, items: Array<ItemData>): Promise<void> {
  const character = bot.character
  if (!character.bank || Object.keys(character.bank).length <= 0) {
    while (!character.bank) {
      bot.logger.info(`${bot.name} waiting for bank items to populate`)
      if (bot.character.map !== 'bank') await bot.easyMove({ map: 'bank', x: 0, y: -200 })
      await bot.wait(0.25)
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
    bot.logger.info(`${bot.name} withdrawing ${bankWithdrawMap[i].item.name}`)
    await character.withdrawItem(bankWithdrawMap[i].slot, bankWithdrawMap[i].index, character.getFirstEmptyInventorySlot())
    await bot.wait(0.25)
  }
}

export function findClosestVendor (bot: Bot, item: ItemName): {distance: any, npc: any} {
  const { maps: gMaps, npcs: gNpcs } = bot.AL.Game.G
  const { x, y, map: charMap } = bot.character
  return Object.values(gMaps as GMap).reduce((npc: any, map: any) => {
    const closestNpcList: Array<any> = Object.values(map.npcs).sort((a: any, b: any) => {
      if (!a.position) {
        return -1
      }
      const compareA = { map: map.name, x: a.position[0], y: a.position[1] }
      const compareB = { map: map.name, x: b.position[0], y: b.position[1] }
      return AL.Tools.distance({ x, y, map: charMap }, compareA) - AL.Tools.distance({ x, y, map: charMap }, compareB)
    }).filter((npc: any) => gNpcs[npc.id].items && gNpcs[npc.id].items.includes(item)) // Filter only npc's with the item we want

    if (!closestNpcList.length) return npc

    const closestDistance = AL.Tools.distance({ x, y, map: charMap }, { map: map.name, x: closestNpcList[0].position[0], y: closestNpcList[0].position[1] })
    if (!npc.distance || closestDistance < npc.distance) {
      npc = {
        npc: closestNpcList[0],
        distance: closestDistance
      }
    }
    return npc
  }, { distance: null, npc: {} })
}

export function findTank (bot: Bot): Bot | undefined {
  return bot.party.members.find((member) => member && member.character.ctype === 'warrior') ||
  bot.party.members.find((member) => member && member.character.ctype === 'priest')
}

export function allPartyPresent (bot: Bot): Boolean {
  if (!bot.party) return false
  return bot.party.members.every((member) => {
    if (member.character.ctype === 'merchant') return true
    return AL.Tools.distance({ x: bot.character.x, y: bot.character.y, map: bot.character.map }, { x: member.character.x, y: member.character.y, map: member.character.map }) <= 250
  })
}
