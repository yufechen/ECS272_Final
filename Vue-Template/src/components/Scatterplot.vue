<template>
  <div class="scatterplot-wrapper">
    <!-- Button to toggle between Pick Rate and Ban Rate -->
    <button @click="toggleMetric" class="toggle-button">
      Toggle to {{ currentMetric === 'Pick Rate' ? 'Ban Rate' : 'Pick Rate' }}
    </button>

    <div class="chart-container" ref="scatterContainer">
      <svg id="scatter-svg"></svg>
    </div>

    <!-- Hero Detail Element -->
    <div v-if="herodetailVisible" class="herodetail">
      <span class="close-btn" @click="herodetailVisible = false">&times;</span>
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
  name: "ScatterPlot",
  data() {
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
      heroDetailData: { hero_id: '', heroName: '', variants: '', ability_rate: '', starting: '', early: '', mid: '', late: ''},
      herodetailVisible: false,
    };
  },
  methods: {
    loadData() {
      // Load the hero names
      d3.csv('../../data/Constants/Constants.Heroes.csv').then((heroesData) => {
        heroesData.forEach((d: any) => {
          this.heroNames[d.id] = d.localized_name;
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
          this.initChart();
        });
      });
    },
    LoadHeroDetailData(){
      d3.csv('../../data/merged_hero_detail.csv', d3.autoType).then((data) => {
        this.heroesDetail = data.map((d: any) => ({
          hero_id: d.hero_id,
          variants: d.variants,
          ability_rate: d.ability_rate,
          starting: d.starting,
          early: d.early,
          mid: d.mid,
          late: d.late,
        }));
        // console.log(this.heroesDetail); // test
      });
    },
    initChart() {
      // Clear previous chart
      d3.select("#scatter-svg").selectAll("*").remove();

      const svg = d3.select("#scatter-svg")
        .attr("width", this.size.width)
        .attr("height", this.size.height);

      svg.append("text")
        .attr("x", this.size.width / 2)
        .attr("y", this.margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Hero ${this.currentMetric} vs Win Rate`);

      const xScale = d3.scaleLinear()
        .domain([0, d3.max(this.sortedHeroes, (d) => this.getMetricValue(d))!])
        .range([this.margin.left, this.size.width - this.margin.right]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(this.sortedHeroes, (d) => d.winRate)!])
        .range([this.size.height - this.margin.bottom, this.margin.top]);

      svg.append("g")
        .attr("transform", `translate(0, ${this.size.height - this.margin.bottom})`)
        .call(d3.axisBottom(xScale).tickFormat((d) => `${d}%`));

      svg.append("g")
        .attr("transform", `translate(${this.margin.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat((d) => `${d}%`));

      // Create and update the circles for the scatter plot
      const circles = svg.selectAll("circle")
        .data(this.sortedHeroes);

      // Enter new circles
      circles.enter().append("circle")
        .attr("cx", (d) => xScale(this.getMetricValue(d)))
        .attr("cy", (d) => yScale(d.winRate))
        .attr("r", 5)
        .attr("fill", "teal")
        .on("mouseover", this.showTooltip)
        .on("mousemove", this.moveTooltip)
        .on("mouseout", this.hideTooltip)
        .on("click", this.showHeroDetail);

      // Update existing circles
      circles.transition()
        .duration(1000)
        .attr("cx", (d) => xScale(this.getMetricValue(d)))
        .attr("cy", (d) => yScale(d.winRate));

      // Remove old circles if any
      circles.exit().remove();
    },
    // Hero detail functions
    initDetail() {
      // Clear previous detail page
      d3.select("#herodetail-svg").selectAll("*").remove();

      // Manege the hero detail info
      const variants = this.heroDetailData.variants ? JSON.parse(this.heroDetailData.variants.replace(/([{,]\s*)(\d+\.\d+)(\s*:)/g, '$1"$2"$3')) : {};
      const ability_rate = this.heroDetailData.ability_rate ? JSON.parse(this.heroDetailData.ability_rate) : {};
      const starting = this.heroDetailData.starting ? JSON.parse(this.heroDetailData.starting) : {};
      const early = this.heroDetailData.early ? JSON.parse(this.heroDetailData.early) : {};
      const mid = this.heroDetailData.mid ? JSON.parse(this.heroDetailData.mid) : {};
      const late = this.heroDetailData.late ? JSON.parse(this.heroDetailData.late) : {};

      let heroKey = `npc_dota_hero_${this.heroDetailData.heroName.toLowerCase().replace(/\s+/g, '_')}`;
      
      if(this.heroDetailData.heroName == "Shadow Fiend") heroKey = 'npc_dota_hero_nevermore';
      if(this.heroDetailData.heroName == "Clockwerk") heroKey = 'npc_dota_hero_rattletrap';

      d3.json('../../data/Constants/hero_abilities.json').then(data => {
        let variantX = 670;
        let variantY = 170;
        variants.forEach((element, index) => {
          let key = Object.keys(element)[0];
          console.log(key)
          const value = element[key];
          const facets = data[heroKey].facets;
          console.log(facets)
          const facet = facets.find(f => f.id === parseInt(key) - 1);
          console.log(facet)
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
                    .attr("width", 1000)
                    .attr("height", 20000);

      // Display example text based on the parsed data
      svg.append("text")
           .attr("x", 10)
           .attr("y", 30)
           .text(`${this.heroDetailData.heroName} Detail`)
           .style("font-family", "Arial")
           .style("font-weight", "bold")
           .style("font-size", "30px");
      
      svg.append("image")
        .attr("x", 670)
        .attr("y", 0)
        .attr("href", '../../data/Images/Heroes/' + this.heroDetailData.heroName.toLowerCase().replace(/ /g, "_") + '.png');

      svg.append("text")
          .attr("x", 10)
          .attr("y", 200)
          .text(`Strating`)
          .style("font-family", "Arial")
          .style("font-size", "20px");

      svg.append("text")
          .attr("x", 180)
          .attr("y", 200)
          .text(`early`)
          .style("font-family", "Arial")
          .style("font-size", "20px");

      svg.append("text")
          .attr("x", 350)
          .attr("y", 200)
          .text(`mid`)
          .style("font-family", "Arial")
          .style("font-size", "20px");

      svg.append("text")
          .attr("x", 520)
          .attr("y", 200)
          .text(`late`)
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

      // Early
      let earlyX = 180;
      let earlyY = 210;
      for (const item of early) {
        if (item.rate < 10) {
          break;
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

      
      
      this.herodetailVisible = true;
    },
    showHeroDetail(event, d) {
      // console.log(d.hero_id);
      const hero = this.heroesDetail.find(hero => hero.hero_id === d.hero_id);
      // console.log(hero);
      if(hero){
        this.heroDetailData = {
        hero_id: d.hero_id,
        heroName: this.heroNames[d.hero_id] || "Unknown Hero",
        variants: hero.variants || '', 
        ability_rate: hero.ability_rate || '', 
        starting: hero.starting || '', 
        early: hero.early || '', 
        mid: hero.mid || '', 
        late: hero.late || '',
        };
      }
      this.initDetail();
      setTimeout(() => {
        this.initDetail();
      }, 1);
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
    toggleMetric() {
      this.currentMetric = this.currentMetric === 'Pick Rate' ? 'Ban Rate' : 'Pick Rate';
      this.initChart();
    },
    updateChartSize() {
      this.size = { width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 };
      this.initChart();
    },
  },
  mounted() {
    console.clear();    // clear console for debug
    this.updateChartSize();
    this.loadData();
    this.LoadHeroDetailData();
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
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

.herodetail {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 1000px; /* max width */
  max-height: 600px;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 1050;
  overflow-y: auto; /* allows scrolling */
  padding: 20px;
  box-sizing: border-box;
  }

  .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    font-size: 24px;
    color: #666;
  }
</style>
