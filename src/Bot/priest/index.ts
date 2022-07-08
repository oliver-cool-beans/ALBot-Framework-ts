import { attackOrHeal } from './strategies/attackOrHeal.js'
import { support } from './strategies/support.js'

const preLoadFunctions = async (bot: any): Promise<void> => {
  bot.attackStrategy = attackOrHeal
  bot.defenceStrategy = support
}

const loadFunctions = async (bot: any): Promise<void> => {
  bot.elixirs = ['elixirint2', 'elixirint1', 'elixirint0']
}

const loopFunctions = async (bot: any): Promise<void> => {

}

export default {
  load: loadFunctions,
  loop: loopFunctions,
  preLoad: preLoadFunctions
}
