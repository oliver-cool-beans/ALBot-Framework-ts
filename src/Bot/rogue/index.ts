const preLoadFunctions = async (bot: any): Promise<void> => {
}

const loadFunctions = async (bot: any): Promise<void> => {
  bot.elixirs = ['elixirdex2', 'elixirdex1', 'elixirdex0']
}

const loopFunctions = async (bot: any): Promise<void> => {

}

export default {
  load: loadFunctions,
  loop: loopFunctions,
  preLoad: preLoadFunctions
}
