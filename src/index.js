import EventEmitter from 'events'

class Besearch extends EventEmitter {
  constructor(Holepunch, SafeFlow, HeliClock) {
    super()
    this.holepunch = Holepunch
    this.safeflow = SafeFlow
    this.heliclock = HeliClock
    this.initialized = false
    this.cycles = []
  }

  async init() {
    if (!this.initialized) {
      this.initialized = true
      await this.loadCycles()
    }
  }

  async loadCycles() {
    console.log('Loading Besearch Cycles...')
    if (this.holepunch?.BeeData?.getBesearch) {
      try {
        const result = await this.holepunch.BeeData.getBesearch(100)
        this.cycles = result || []
      } catch (err) {
        console.error('Error loading cycles:', err)
        this.cycles = []
      }
    } else {
      console.warn('Holepunch BeeData.getBesearch not available')
      this.cycles = []
    }
  }

  async saveCycle(cycle) {
    console.log('Saving Besearch Cycle...', cycle.id)
    if (this.holepunch?.BeeData?.saveBesearch) {
      try {
        await this.holepunch.BeeData.saveBesearch(cycle)
      } catch (err) {
        console.error('Error saving cycle:', err)
      }
    } else {
      console.warn('Holepunch BeeData.saveBesearch not available')
    }
  }

  async startCycle(cycleData) {
    await this.init()
    const now = Date.now()
    
    // Use injected HeliClock
    let orbitalVector
    if (this.heliclock?.get_orbital_degree) {
        orbitalVector = this.heliclock.get_orbital_degree(BigInt(now))
    } else {
        console.warn('HeliClock not available in Besearch')
        orbitalVector = 0 // Default or error
    }
    
    console.log('Starting Besearch Cycle', cycleData.name, orbitalVector)
    
    const cycle = {
      id: cycleData.id || Date.now().toString(),
      ...cycleData,
      stage: 1, // 1: Context, 2: Research, 3: Search, 4: Emulation
      startTime: now,
      vector: orbitalVector,
      active: true,
      linkedInterventions: cycleData.linkedInterventions || []
    }
    
    this.cycles.push(cycle)
    await this.saveCycle(cycle)
    
    await this.processStage(cycle)
    
    return cycle
  }

  /**
   * Called by HOP main loop on every HeliClock tick
   */
  async checkTriggers(vector) {
      for (const cycle of this.cycles) {
          if (cycle.active) {
              // Logic to advance stage based on vector or other triggers
              // For now, we just process the current stage
              await this.processStage(cycle)
          }
      }
  }
  
  async processStage(cycle) {
      console.log(`Processing Stage ${cycle.stage} for cycle ${cycle.id}`)
      
      let changed = false

      // 1. Context (Data) -> 2. Research (Grounding)
      if (cycle.stage === 1) {
          // Validate data context
          // TODO: Real validation logic
          cycle.stage = 2
          changed = true
      }
      
      // 2. Research -> 3. Search (Compute)
      if (cycle.stage === 2) {
          // Check reference contracts
          // TODO: Real research linking
          cycle.stage = 3
          changed = true
          await this.triggerCompute(cycle)
      }
      
      // 3. Search -> 4. Emulation (Decide)
      if (cycle.stage === 3) {
          // Wait for compute results
          // This would typically be triggered by a SafeFlow event
          // cycle.stage = 4
          // changed = true
      }

      if (changed) {
          await this.saveCycle(cycle)
          this.emit('cycle-updated', cycle)
      }
  }

  async triggerCompute(cycle) {
      console.log('Triggering Compute via SafeFlow')
      const hopQuery = {
          type: 'compute',
          nxp: cycle.nxpId,
          context: cycle.context,
          vector: cycle.vector
      }
      
      if (this.safeflow?.startFlow) {
          try {
              await this.safeflow.startFlow(hopQuery)
          } catch (err) {
              console.error('Error triggering compute:', err)
          }
      } else {
          console.warn('SafeFlow.startFlow not available')
      }
  }
}

export default Besearch
