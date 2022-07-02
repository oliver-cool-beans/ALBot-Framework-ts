const preLoadFunctions = async (Bot: any): Promise<void> => {

}

const loadFunctions = async (Bot: any): Promise<void> => {
  Bot.elixirs = ['elixirint2', 'elixirint1', 'elixirint0']
}

const loopFunctions = async (Bot: any): Promise<void> => {

}

export default {
  load: loadFunctions,
  loop: loopFunctions,
  preLoad: preLoadFunctions
}
