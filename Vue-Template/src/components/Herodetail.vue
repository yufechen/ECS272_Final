<template>
    <div class="scatterplot-wrapper">
      <!-- Hero Detail Element -->
      <div v-if="herodetailVisible" class="scatterplot-wrapper">
        <svg id="herodetail-svg"></svg>
      </div>
  
      <!-- Tooltip Element -->
      <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
        <strong>{{ tooltipData.heroName }}</strong><br />
        {{ currentMetric }}: {{ tooltipData.metricValue }}%<br />
        Win Rate: {{ tooltipData.winRate }}%
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { useCurrentHero } from '../stores/store';
  import * as d3 from "d3";
  
  
  interface HeroData {
    hero_id: string;
    pickRate: number;
    banRate: number;
    winRate: number;
  }
  
  interface HeroDetail {
    hero_id: number;
    variants: string;
    ability_rate: string;
    starting: string;
    early: string;
    mid: string;
    late: string;
  }

  
  export default {
    name: "HeroDetail",
    data() {
        const currentHero = useCurrentHero();
      return {
        heroes: [] as HeroData[],
        sortedHeroes: [] as HeroData[],  // Array to store sorted heroes
        heroNames: {} as Record<string, string>, // Mapping hero_id to hero names
        size: { width: 0, height: 0 },
        margin: { left: 50, right: 20, top: 60, bottom: 50 },
        tooltipVisible: false,
        tooltipData: { hero_id: '', heroName: '', metricValue: 0, winRate: 0 },
        tooltipStyle: { left: '0px', top: '0px' },
        currentMetric: 'Pick Rate', // Initial metric
  
        // Hero detail vars
        heroesDetail: [] as HeroDetail[],   // Array to store HeroDetail
        heroKeys: {} as Record<string, string>, // Mapping hero_id to hero names
        heroDetailData: { hero_id: '', heroName: '', variants: '', ability_rate: '', starting: '', early: '', mid: '', late: ''},
        herodetailVisible: true,
        currentHero,
      };
    },
    methods: {
      loadData() {
        // Load the hero names
        d3.csv('../../data/Constants/Constants.Heroes.csv').then((heroesData) => {
          heroesData.forEach((d: any) => {
            this.heroNames[d.id] = d.localized_name;
            this.heroKeys[d.id] = d.name;
          });
  
          // Load hero pick/ban rates
          d3.csv('../../data/merged_hero_data.csv', d3.autoType).then((data) => {
            this.heroes = data.map((d: any) => ({
              hero_id: d.hero_id,
              pickRate: d['Pick Rate'],
              banRate: d['Ban Rate'],
              winRate: d['Win Rate'],
            }));
            this.sortedHeroes = [...this.heroes];  // Initialize sortedHeroes
          });
        });

        // Load hero detail 
        d3.csv('../../data/merged_hero_detail.csv', d3.autoType).then((data) => {
          // console.log(data);
          this.heroesDetail = data.map((d: any) => ({
            hero_id: d.hero_id,
            variants: d.variants,
            ability_rate: d.ability_rate,
            starting: d.starting,
            early: d.early,
            mid: d.mid,
            late: d.late,
          }));
          // console.log("Mapped Data:", this.heroesDetail);
          this.initDetail();
        });
      },
      // Hero detail functions
      initDetail() {
        // Clear previous detail page
        d3.select("#herodetail-svg").selectAll("*").remove();

        // console.log(this.currentHero.chosenState);
        const hero = this.heroesDetail.find(hero => hero.hero_id === this.currentHero.chosenState);
        
        if(hero){
          this.heroDetailData = {
          hero_id: this.currentHero.chosenState.toString(),
          heroName: this.heroNames[this.currentHero.chosenState] || "Unknown Hero",
          variants: hero.variants || '', 
          ability_rate: hero.ability_rate || '', 
          starting: hero.starting || '', 
          early: hero.early || '', 
          mid: hero.mid || '', 
          late: hero.late || '',
          };
        }
        
        // console.log(this.heroDetailData);
        // Manege the hero detail info
        const variants = this.heroDetailData.variants ? JSON.parse(this.heroDetailData.variants.replace(/([{,]\s*)(\d+\.\d+)(\s*:)/g, '$1"$2"$3')) : {};
        const ability_rate = this.heroDetailData.ability_rate ? JSON.parse(this.heroDetailData.ability_rate) : {};
        const starting = this.heroDetailData.starting ? JSON.parse(this.heroDetailData.starting) : {};
        const early = this.heroDetailData.early ? JSON.parse(this.heroDetailData.early) : {};
        const mid = this.heroDetailData.mid ? JSON.parse(this.heroDetailData.mid) : {};
        const late = this.heroDetailData.late ? JSON.parse(this.heroDetailData.late) : {};
  
        let heroKey = this.heroKeys[this.currentHero.chosenState];

        // console.log(itemData);

        d3.json('../../data/Constants/hero_abilities.json').then(data => {
          let variantX = 670;
          let variantY = 170;
          variants.forEach((element, index) => {
            let key = Object.keys(element)[0];
            // console.log(key)
            const value = element[key];
            const facets = data[heroKey].facets;
            // console.log(facets)
            const facet = facets.find(f => f.id === parseInt(key) - 1);
            // console.log(facet)
            svg.append("text")
              .attr("x", variantX)
              .attr("y", variantY)
              .text(`${facet.name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}: ${value}%`)
              .style("font-family", "Arial")
              .style("font-weight", "bold")
              .style("font-size", "15px");
            variantY += 20
          })
        });

        const svg = d3.select("#herodetail-svg")
                      .attr("width", 1200)
                      .attr("height", 2000);
  
        // Display example text based on the parsed data
        svg.append("text")
             .attr("x", 10)
             .attr("y", 30)
             .text(`${this.heroDetailData.heroName} Detail`)
             .style("font-family", "Arial")
             .style("font-weight", "bold")
             .style("font-size", "30px");
        
        svg.append("image")
        .attr("width", 256)
        .attr("height", 144)
        .attr("x", 670)
        .attr("y", 0)
        .attr("href", '../../data/Images/Heroes/' + heroKey.replace('npc_dota_hero_', '') + '.png');
        
  
        svg.append("text")
            .attr("x", 10)
            .attr("y", 200)
            .text(`Starting`)
            .style("font-family", "Arial")
            .style("font-size", "20px");
  
        svg.append("text")
            .attr("x", 180)
            .attr("y", 200)
            .text(`Early`)
            .style("font-family", "Arial")
            .style("font-size", "20px");
  
        svg.append("text")
            .attr("x", 350)
            .attr("y", 200)
            .text(`Mid`)
            .style("font-family", "Arial")
            .style("font-size", "20px");
  
        svg.append("text")
            .attr("x", 520)
            .attr("y", 200)
            .text(`Late`)
            .style("font-family", "Arial")
            .style("font-size", "20px");
  
        // Ability
        let abilityX = 10;
        let abilityY = 50;
        for (const item of ability_rate) {
          if (abilityY > 120) break;
          if (item.ability_id == "special_bonus_attributes") continue;
          if (item.ability_id == "left" || item.ability_id == "right") {
            svg.append("image")
              .attr("x", abilityX)
              .attr("y", abilityY)
              .attr("width", 54)
              .attr("height", 54)
              .attr("href", '../../data/Images/Abilities/talents.png')
              .append("title")
              .text(`${item.ability_id}`);
  
            svg.append("text")
              .attr("x", abilityX + 2)
              .attr("y", abilityY + 18)
              .text(`${item.ability_id}`)
              .style("font-weight", "bold")
              .style("font-size", "20px")
              .attr("fill", "magenta");
  
            if (abilityX >= 590) {
              abilityX = 10;
              abilityY += 54;
              continue;
            }
            abilityX += 54;
            continue;
          }
          svg.append("image")
          .attr("x", abilityX)
          .attr("y", abilityY)
          .attr("width", 54)
          .attr("height", 54)
          .attr("href", '../../data/Images/Abilities/' + item.ability_id.toLowerCase() + '.png')
          .on("error", function() {
              d3.select(this).attr("href", '../../data/Images/Abilities/invoker_empty1.png');
          })
          .append("title")
          .text(`${item.ability_id}`);
  
          if (abilityX >= 590) {
            abilityX = 10;
            abilityY += 54;
            continue;
          }
          abilityX += 54;
        }
  
  
        // Starting
        let startingX = 10;
        let startingY = 210;
        for (const item of starting) {
          if (item.rate < 10) {
            break;
          }
  
          svg.append("image")
          .attr("x", startingX)
          .attr("y", startingY)
          .attr("width", 70.4)
          .attr("height", 51.2)
          .attr("href", '../../data/Images/Items/' + item.item + '.png')
          .append("title")
          .text(`${item.item}`);
  
          svg.append("text")
          .attr("x", startingX + 80.4)
          .attr("y", startingY + 30)
          .attr("height", 51.2)
          .text(`${item.rate}%`)
          .style("font-size", "20px");
  
          startingY += 51.2;
        }
        
        d3.json('../../data/Constants/items.json').then((data) => {
            // Early
            let earlyX = 180;
            let earlyY = 210;
            for (const item of early) {
                if (item.rate < 10) {
                    break;
                }

                if(data[item.item] && data[item.item].qual === 'consumable'){
                    continue
                }

                svg.append("image")
                .attr("x", earlyX)
                .attr("y", earlyY)
                .attr("width", 70.4)
                .attr("height", 51.2)
                .attr("href", '../../data/Images/Items/' + item.item + '.png')
                .append("title")
                .text(`${item.item}`);
        
                svg.append("text")
                .attr("x", earlyX + 80.4)
                .attr("y", earlyY + 30)
                .attr("height", 51.2)
                .text(`${item.rate}%`)
                .style("font-size", "20px");
        
                earlyY += 51.2;
            }
    
            // Mid
            let midX = 350;
            let midY = 210;
            for (const item of mid) {
                if (item.rate < 10) {
                    break;
                }
                
                if(data[item.item] && data[item.item].qual === 'consumable'){
                    continue
                }

                if(data[item.item] && data[item.item].cost <= 2000){
                    continue
                }
        
                svg.append("image")
                .attr("x", midX)
                .attr("y", midY)
                .attr("width", 70.4)
                .attr("height", 51.2)
                .attr("href", '../../data/Images/Items/' + item.item + '.png')
                .append("title")
                .text(`${item.item}`);
        
                svg.append("text")
                .attr("x", midX + 80.4)
                .attr("y", midY + 30)
                .attr("height", 51.2)
                .text(`${item.rate}%`)
                .style("font-size", "20px");
        
                midY += 51.2;
            }
    
            // Late
            let lateX = 520;
            let lateY = 210;
            for (const item of late) {
                if (item.rate < 10) {
                    break;
                }

                if(data[item.item] && data[item.item].qual === 'consumable'){
                    continue
                }

                if(data[item.item] && data[item.item].cost <= 2000){
                    continue
                }
        
                svg.append("image")
                .attr("x", lateX)
                .attr("y", lateY)
                .attr("width", 70.4)
                .attr("height", 51.2)
                .attr("href", '../../data/Images/Items/' + item.item + '.png')
                .append("title")
                .text(`${item.item}`);
        
                
        
                svg.append("text")
                .attr("x", lateX + 80.4)
                .attr("y", lateY + 30)
                .attr("height", 51.2)
                .text(`${item.rate}%`)
                .style("font-size", "20px");
        
                lateY += 51.2;
            }
        });
  
        this.herodetailVisible = true;
      },
      showTooltip(event, d) {
        this.tooltipData = {
          hero_id: d.hero_id,
          heroName: this.heroNames[d.hero_id] || "Unknown Hero",
          metricValue: this.getMetricValue(d),
          winRate: d.winRate,
        };
        this.tooltipVisible = true;
        this.moveTooltip(event);
      },
      getMetricValue(d) {
        return this.currentMetric === 'Pick Rate' ? d.pickRate : d.banRate;
      },
      moveTooltip(event) {
        let tooltipLeft = event.pageX + 10;
        let tooltipTop = event.pageY + 10;
  
        // Adjust tooltip position if it's near the edges of the screen
        const tooltipWidth = 150; // Approximate tooltip width
        const tooltipHeight = 40; // Approximate tooltip height
        const padding = 10;
  
        // Check if the tooltip goes off the right edge
        if (tooltipLeft + tooltipWidth > window.innerWidth) {
          tooltipLeft = window.innerWidth - tooltipWidth - padding;
        }
  
        // Check if the tooltip goes off the bottom edge
        if (tooltipTop + tooltipHeight > window.innerHeight) {
          tooltipTop = window.innerHeight - tooltipHeight - padding;
        }
  
        // Set the tooltip position
        this.tooltipStyle = {
          left: `${tooltipLeft}px`,
          top: `${tooltipTop}px`,
        };
      },
      hideTooltip() {
        this.tooltipVisible = false;
      },
      updateChartSize() {
        this.size = { width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 };
        // this.initChart();
      },
    },
    watch: {
    // Watch for changes to the currentHero.chosenState
    'currentHero.chosenState': {
            handler(newVal, oldVal) {
                console.log(`currentHero.chosenState changed from ${oldVal} to ${newVal}`);
                this.initDetail();
            },
        },
    },
    mounted() {
      console.clear();    // clear console for debug
      this.updateChartSize();
      this.loadData();
      window.addEventListener("resize", this.updateChartSize);
    },
    beforeDestroy() {
      window.removeEventListener("resize", this.updateChartSize);
    },
  };
  </script>
  
  <style scoped>
  html, body, #app {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  
  .scatterplot-wrapper {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: left;
    margin-left: 50px;
    height: 200vh;
    width: 100vw;
    position: relative;
  }
  
  .toggle-button {
    margin-bottom: 10px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .chart-container {
    width: 100%;
    height: 100%;
    margin-top: 150px
  }
  
  #scatter-svg {
    display: block;
    margin: auto;
  }
  
  .tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
  }
  
  </style>
  