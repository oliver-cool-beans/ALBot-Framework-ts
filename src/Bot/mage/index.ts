import { calculatePotionItems } from '../../helpers/index.js'

const preLoadFunctions = async (bot: any): Promise<void> => {
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
