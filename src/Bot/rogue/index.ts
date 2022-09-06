import { calculatePotionItems } from '../../helpers/index.js'
import { attack } from './strategies/attack.js'

const preLoadFunctions = async (bot: any): Promise<void> => {
  bot.attackStrategy = attack
  const { hpot, mpot } = calculatePotionItems(bot.level)
  bot.itemsToHold = [hpot, mpot, 'tracker']
}

const loadFunctions = async (bot: any): Promise<void> => {
  bot.elixirs = [{ name: 'elixirdex2' }, { name: 'elixirdex1' }, { name: 'elixirdex0' }]
}

const loopFunctions = async (bot: any): Promise<void> => {

}

export default {
  load: loadFunctions,
  loop: loopFunctions,
  preLoad: preLoadFunctions
}
