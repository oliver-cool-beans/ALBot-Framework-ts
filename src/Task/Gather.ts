import { IPosition, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'

export default class FinishMonsterHunt extends Task {
  positions: {fishing: IPosition, mining: IPosition}
  type: 'fishing' | 'mining'
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.positions = {
      fishing: { map: 'main', x: -1198, y: -288 },
      mining: { map: 'tunnel', x: -280, y: -10 }
    }

    this.type = args.type
  }

  getTool (): 'rod' | 'pickaxe' {
    return this.type === 'fishing' ? 'rod' : 'pickaxe'
  }

  getFunctionName (): 'fish' | 'mine' {
    return this.type === 'fishing' ? 'fish' : 'mine'
  }

  async loop (): Promise<void> {
    const character = this.bot.character
    const tool = this.getTool()
    const functionName = this.getFunctionName()

    if (character.ctype !== 'merchant') return this.removeFromQueue()
    if (!character.canUse(this.type, { ignoreEquipped: true })) return this.removeFromQueue()
    if (!character.hasItem(tool) && !character.isEquipped(tool)) return this.removeFromQueue()

    await character.closeMerchantStand()
    await character.smartMove(this.positions[this.type]).catch(() => {})

    const offhand = character.slots.offhand?.name

    if (!character.isEquipped(tool)) {
      if (offhand) await character.unequip('offhand')
      const mainHandSlot = character.locateItem(tool, character.items)
      await character.equip(mainHandSlot)
    }

    console.log('we are going to', functionName)
    while (character.canUse(this.type)) {
      await character[functionName]().catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to ${functionName} - ${error}`)
      })
    }

    await character.unequip('mainhand')
  }
}
