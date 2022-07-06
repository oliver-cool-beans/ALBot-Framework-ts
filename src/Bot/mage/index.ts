const preLoadFunctions = async (bot: any): Promise<void> => {

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
