<template>
  <div class="scatterplot-wrapper">
    <div class="filters-container">
      <div class="role-filter">
        <label class="role-label">Select Roles:</label>
        <div class="checkbox-container">
          <div v-for="role in uniqueRoles" :key="role" class="checkbox-item">
            <input
              type="checkbox"
              :value="role"
              v-model="selectedRoles"
              @change="filterHeroes"
            />
            <label>{{ role }}</label>
          </div>
        </div>
      </div>

      <div class="attack-type-filter">
        <label class="role-label">Select Attack Type:</label>
        <div class="checkbox-container">
          <div v-for="attackType in uniqueAttackTypes" :key="attackType" class="checkbox-item">
            <input
              type="checkbox"
              :value="attackType"
              v-model="selectedAttackTypes"
              @change="filterHeroes"
            />
            <label>{{ attackType }}</label>
          </div>
        </div>
      </div>
    </div>

    <!-- Button to toggle between Pick Rate and Ban Rate -->
    <button @click="toggleMetric" class="toggle-button" :class="{'clicked': isClicked}">
      Toggle to {{ currentMetric === 'Pick Rate' ? 'Ban Rate' : 'Pick Rate' }}
    </button>

    <div class="chart-container" ref="scatterContainer">
      <svg id="scatter-svg"></svg>
    </div>

    <!-- Tooltip Element -->
    <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
      <strong>{{ tooltipData.heroName }}</strong><br />
      Win Rate: {{ tooltipData.winRate }}%<br />
      Pick Rate: {{ tooltipData.pickRate }}%<br />
      Ban Rate: {{ tooltipData.banRate }}%<br />
      Attack Type: {{ tooltipData.attackType }}<br />
      Role(s): {{ tooltipData.roles }}<br />
      
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
  pickRank: number;
  banRank: number;
  attackType: string;
  npcName: string;
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
      tooltipData: { hero_id: '', heroName: '', banRate: 0, metricValue: 0, pickRate: 0, winRate: 0, attackType: '', roles: []},
      tooltipStyle: { left: '0px', top: '0px' },
      currentMetric: 'Pick Rate', // Initial metric
      roles: [] as string[], // Store roles for filtering
      selectedRoles: [] as string[], // Array of selected roles
      uniqueRoles: [] as string[], // All unique roles
      selectedAttackTypes: [] as string[],  // Store selected attack types
      uniqueAttackTypes: ['Melee', 'Ranged'] as string[],  // Available attack types
      isClicked: false,

      // Hero detail vars
      heroesDetail: [] as HeroDetail[],   // Array to store HeroDetail
      heroNPCData: {} as Record<string, string>, // Mapping ID to NPC names
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
          this.heroNPCData[d.id] = d.name;

          // Normalize and clean up roles
          const heroRoles = d.roles
            .replace(/[\[\]"' ]/g, '') // Remove brackets, quotes, and spaces
            .split(',') // Split into an array
            .map((role) => role.trim()); // Trim spaces from each role

          this.roles.push(...heroRoles); // Add cleaned roles to the roles array
        });

        // Get unique roles
        this.uniqueRoles = [...new Set(this.roles)];

        // Load hero pick/ban rates
        d3.csv('../../data/merged_hero_data.csv', d3.autoType).then((data) => {
          this.heroes = data.map((d: any) => ({
            hero_id: d.hero_id,
            pickRate: d['Pick Rate'],
            banRate: d['Ban Rate'],
            winRate: d['Win Rate'],
            banRank: d['Ban Rank'],
            pickRank: d['Pick Rank'],
            attackType: d['attack_type'], // Added attackType field
            npcName: this.heroNPCData[d.hero_id],

            // Normalize and clean up roles in the hero data
            roles: d.roles
              .replace(/[\[\]"' ]/g, '') // Remove brackets, quotes, and spaces
              .split(',') // Split into an array
              .map((role) => role.trim()), // Trim spaces from each role
          }));

          this.sortedHeroes = [...this.heroes]; // Initialize sortedHeroes
          this.initChart();
      });
    });
  },
    // New method to filter by both roles and attack types
    filterHeroes() {
      let filteredHeroes = this.heroes;

      // Filter by selected roles
      if (this.selectedRoles.length > 0) {
        filteredHeroes = filteredHeroes.filter((hero) =>
          this.selectedRoles.every((role) => hero.roles.includes(role))
        );
      }

      // Filter by selected attack types
      if (this.selectedAttackTypes.length > 0) {
        filteredHeroes = filteredHeroes.filter((hero) =>
          this.selectedAttackTypes.every((attackType) => hero.attackType.includes(attackType))
        );
      }

      // Update sortedHeroes with the filtered results
      this.sortedHeroes = filteredHeroes;
      this.initChart();
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
        .style("font-size", "20px")  // Increased font size
        .style("font-weight", "bold")
        .text(`Dota 2 Hero Win Rate vs ${this.currentMetric}`);

      // Calculate a shared max value for the X-axis across both metrics
      const maxMetricValue = d3.max(this.heroes, (d) => Math.max(d.pickRate, d.banRate))!;

      // Create scales
      const xScale = d3.scaleLinear()
        .domain([0, maxMetricValue]) // Use shared max value
        .range([this.margin.left, this.size.width - this.margin.right]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(this.heroes, (d) => d.winRate)!])
        .range([this.size.height - this.margin.bottom, this.margin.top]);

      // Render X Axis
      const xAxis = d3.axisBottom(xScale).tickFormat((d) => `${d}%`);
      svg.selectAll(".x-axis")
        .data([null]) // Bind to a single element
        .join(
          enter => enter.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${this.size.height - this.margin.bottom})`)
            .call(xAxis)
        );

      // Add x-axis label with increased font size
      svg.append("text")
        .attr("x", this.size.width / 2)
        .attr("y", this.size.height - this.margin.bottom + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")  // Increased font size
        .text(this.currentMetric === 'Pick Rate' ? 'Pick Rate' : 'Ban Rate');

      // Render Y Axis
      const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${d}%`);
      svg.selectAll(".y-axis")
        .data([null])
        .join(
          enter => enter.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${this.margin.left}, 0)`)
            .call(yAxis)
        );

      // Add y-axis label with increased font size and adjusted position
      svg.append("text")
        .attr("x", -this.size.height / 2 - 30) // Moved further to the left
        .attr("y", this.margin.left - 30)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")  // Increased font size
        .text("Win Rate");

      // Bind data to miniImages
      const miniImages = svg.selectAll("image")
        .data(this.sortedHeroes, (d) => d.hero_id);

      // Enter new miniImages
      miniImages.enter().append("image")
        .attr("x", (d) => xScale(d.prevMetric || this.getMetricValue(d))) // Use previous value for smooth transition
        .attr("y", (d) => yScale(d.winRate))
        .attr("width", 20)  // Set image width (adjust as needed)
        .attr("height", 20) // Set image height (adjust as needed)
        .attr("href", (d) => '../../data/Images/Miniheroes/' + d.npcName.replace('npc_dota_hero_', '') + '.png')
        .style("opacity", 0.7)
        .on("mouseover", this.showTooltip)
        .on("mousemove", this.moveTooltip)
        .on("mouseout", this.hideTooltip)
        .on("click", this.changeCurrentHero)
        .transition().duration(1000)
        .attr("x", (d) => xScale(this.getMetricValue(d)))  // Transition to new X position
        .attr("y", (d) => yScale(d.winRate))              // Transition to new Y position
        .ease(d3.easeCubic);

      // Update existing images
      miniImages.transition().duration(1000)
        .attr("x", (d) => xScale(this.getMetricValue(d)))
        .attr("y", (d) => yScale(d.winRate))
        .ease(d3.easeCubic);

      // Remove old circles
      miniImages.exit()
        .transition().duration(1000)
        .style("opacity", 0)
        .remove();

      this.sortedHeroes.forEach((d) => {
        d.prevMetric = this.getMetricValue(d);
      });
    },

    changeCurrentHero(event, d) {
      const currentHero = useCurrentHero();
      currentHero.setCurrentHero(d.hero_id);
      //console.log(currentHero.chosenState);
    },

    showTooltip(event, d) {
      this.tooltipData = {
        hero_id: d.hero_id,
        heroName: "Hero Name: " + this.heroNames[d.hero_id] || "Unknown Hero",
        winRate: d.winRate,
        attackType: d.attackType,
        banRate: d.banRate,
        pickRate: d.pickRate,
        roles: d.roles,
        metricValue: this.getMetricValue(d),

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
      this.isClicked = !this.isClicked; // Toggle the clicked state
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

.filters-container {
  display: flex; /* Makes children align horizontally */
  gap: 20px; /* Adds space between the two divs */
  align-items: flex-start; /* Aligns items to the top */
}

.role-filter,
.attack-type-filter {
  flex: 1; /* Makes both divs take equal space, optional */
  max-width: 45%; /* Adjust width if needed */
}

.role-label {
    text-align: center;
    font-weight: bold;
    margin-bottom: 10px;
    margin-top: 20px;
}

.checkbox-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
}

.checkbox-item input {
  margin-right: 5px;
}

.toggle-button {
  background-color: #ff0000; /* Default background color */
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease; /* Smooth transition for background color */
}

.toggle-button.clicked {
  background-color: #28a745; /* New color when clicked */
}

.toggle-button:active {
  background-color: #e7eaec; /* Darker shade when pressed */
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
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

</style>