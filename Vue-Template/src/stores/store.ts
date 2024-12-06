import { defineStore } from 'pinia'

interface CurrentHero {
    chosenState: number;
}

export const useCurrentHero = defineStore('global', {
    state: () => ({
        chosenState: 1,
    }),

    actions: {
        setCurrentHero(newValue: number) {
            this.chosenState = newValue;
        }
    }
})

