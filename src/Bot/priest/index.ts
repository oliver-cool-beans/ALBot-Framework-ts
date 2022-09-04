import { calculatePotionItems } from '../../helpers/index.js'
import { attackOrHeal } from './strategies/attackOrHeal.js'
import { support } from './strategies/support.js'

const preLoadFunctions = async (bot: any): Promise<void> => {
  bot.attackStrategy = attackOrHeal
  bot.defenceStrategy = support
  const { hpot, mpot } = calculatePotionItems(bot.level)
  bot.itemsToHold = [hpot, mpot, 'tracker']
}

const loadFunctions = async (bot: any): Promise<void> => {
  bot.elixirs = [{ name: 'elixirint2' }, { name: 'elixirint1' }, { name: 'elixirint0' }]
}

const loopFunctions = async (bot: any): Promise<void> => {

}

export default {
  load: loadFunctions,
  loop: loopFunctions,
  preLoad: preLoadFunctions
}
