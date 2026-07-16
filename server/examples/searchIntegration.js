/**
 * Search API Integration Examples
 * 
 * This file shows how to integrate the semantic search API
 * with your frontend or other services.
 * 
 * @module examples/searchIntegration
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Example 1: Basic Resume Search
 * 
 * Search a specific resume with a natural language query
 */
export const basicSearch = async (token, resumeId, query) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/search`,
      {
        resumeId,
        query,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Found ${response.data.totalResults} results`);
    
    response.data.results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.sectionName} (${(result.score * 100).toFixed(1)}%)`);
      console.log(`   ${result.text.substring(0, 150)}...`);
    });

    return response.data;
  } catch (error) {
    console.error('Search failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Example 2: Search with Advanced Options
 * 
 * Search with custom topK and section filters
 */
export const advancedSearch = async (token, resumeId, query, options = {}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/search`,
      {
        resumeId,
        query,
        topK: options.topK || 5,
        sections: options.sections || undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Advanced search failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Example 3: Multi-Resume Search
 * 
 * Search across all user's resumes
 */
export const multiResumeSearch = async (token, query, options = {}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/search/multiple`,
      {
        query,
        topK: options.topK || 3,
        resumeIds: options.resumeIds || undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Found results in ${response.data.totalResumes} resumes`);
    
    response.data.results.forEach((resume) => {
      console.log(`\n${resume.fileName}:`);
      resume.results.forEach((match) => {
        console.log(`  - ${match.sectionName}: ${(match.score * 100).toFixed(1)}%`);
      });
    });

    return response.data;
  } catch (error) {
    console.error('Multi-resume search failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Example 4: Get Search Suggestions
 * 
 * Get suggested queries based on resume content
 */
export const getSearchSuggestions = async (token, resumeId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/search/suggestions/${resumeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Search Suggestions:');
    response.data.sections.forEach((section) => {
      console.log(`\n${section.section}:`);
      section.suggestedQueries.forEach((query) => {
        console.log(`  - "${query}"`);
      });
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get suggestions:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Example 5: Get Search Statistics
 * 
 * Check if a resume is searchable and get statistics
 */
export const getSearchStats = async (token, resumeId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/search/stats/${resumeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const stats = response.data.stats;
    console.log(`Resume: ${stats.fileName}`);
    console.log(`Searchable: ${stats.searchable ? 'Yes' : 'No'}`);
    console.log(`Total Chunks: ${stats.totalChunks}`);
    console.log(`Sections: ${Object.keys(stats.sections).join(', ')}`);

    return response.data;
  } catch (error) {
    console.error('Failed to get stats:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Example 6: Search with Error Handling
 * 
 * Comprehensive error handling for different scenarios
 */
export const searchWithErrorHandling = async (token, resumeId, query) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/search`,
      { resumeId, query },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Success
    if (response.data.totalResults === 0) {
      console.log('No results found. Try a different query.');
      // Show suggestions
      const suggestions = await getSearchSuggestions(token, resumeId);
      return { ...response.data, suggestions };
    }

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 400:
        if (message.includes('pending') || message.includes('processing')) {
          console.error('Resume embeddings are not ready yet. Please wait.');
          return { error: 'embeddings_not_ready', message };
        }
        console.error('Invalid query:', message);
        return { error: 'invalid_query', message };

      case 403:
        console.error('Access denied:', message);
        return { error: 'access_denied', message };

      case 404:
        console.error('Resume not found:', message);
        return { error: 'not_found', message };

      case 500:
        console.error('Server error:', message);
        return { error: 'server_error', message };

      default:
        console.error('Unknown error:', error.message);
        return { error: 'unknown', message: error.message };
    }
  }
};

/**
 * Example 7: React Hook for Search
 * 
 * Custom React hook for search functionality
 */
export const useResumeSearch = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (token, resumeId, query, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await advancedSearch(token, resumeId, query, options);
      setResults(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return { results, loading, error, search, clearResults };
};

/**
 * Example 8: Search History Manager
 * 
 * Track and manage search history
 */
export class SearchHistoryManager {
  constructor(storageKey = 'search_history') {
    this.storageKey = storageKey;
    this.maxHistorySize = 50;
  }

  addSearch(query, resumeId, results) {
    const history = this.getHistory();
    
    const entry = {
      query,
      resumeId,
      timestamp: new Date().toISOString(),
      resultCount: results.totalResults,
    };

    history.unshift(entry);
    
    // Keep only recent entries
    if (history.length > this.maxHistorySize) {
      history.pop();
    }

    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  getHistory() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  getRecentQueries(limit = 10) {
    const history = this.getHistory();
    return history.slice(0, limit).map((entry) => entry.query);
  }

  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }
}

/**
 * Example 9: Search Result Formatter
 * 
 * Format search results for display
 */
export const formatSearchResults = (results) => {
  if (!results || results.totalResults === 0) {
    return {
      hasResults: false,
      message: 'No results found',
    };
  }

  return {
    hasResults: true,
    query: results.query,
    fileName: results.fileName,
    results: results.results.map((result) => ({
      id: result.chunkId,
      section: result.sectionName,
      score: Math.round(result.score * 100),
      text: result.text,
      highlight: highlightKeywords(result.text, results.query),
    })),
  };
};

/**
 * Helper: Highlight keywords in text
 */
const highlightKeywords = (text, query) => {
  // Simple keyword highlighting
  const keywords = query.toLowerCase().split(' ').filter((w) => w.length > 2);
  
  let highlighted = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
};

/**
 * Example 10: Complete Search Component Pattern
 * 
 * Full example of a search component implementation
 */
export const SearchComponent = {
  /**
   * Initialize search
   */
  async initialize(token, resumeId) {
    // Check if resume is searchable
    const stats = await getSearchStats(token, resumeId);
    
    if (!stats.stats.searchable) {
      throw new Error('Resume is not searchable yet');
    }

    // Get suggestions
    const suggestions = await getSearchSuggestions(token, resumeId);

    return {
      searchable: true,
      stats: stats.stats,
      suggestions: suggestions.sections,
    };
  },

  /**
   * Perform search
   */
  async performSearch(token, resumeId, query, options = {}) {
    // Validate query
    if (!query || query.trim().length < 2) {
      throw new Error('Query must be at least 2 characters');
    }

    // Search
    const results = await advancedSearch(token, resumeId, query, options);

    // Add to history
    const historyManager = new SearchHistoryManager();
    historyManager.addSearch(query, resumeId, results);

    // Format results
    const formatted = formatSearchResults(results);

    return formatted;
  },

  /**
   * Handle empty results
   */
  async handleEmptyResults(token, resumeId) {
    // Get suggestions for alternative queries
    const suggestions = await getSearchSuggestions(token, resumeId);
    
    return {
      message: 'No results found. Try these suggestions:',
      suggestions: suggestions.sections.flatMap((s) => s.suggestedQueries).slice(0, 5),
    };
  },
};

/**
 * Example 11: Batch Search with Debouncing
 * 
 * Search with debouncing for real-time search
 */
export class DebouncedSearch {
  constructor(token, delay = 500) {
    this.token = token;
    this.delay = delay;
    this.timeoutId = null;
  }

  search(resumeId, query, callback) {
    // Clear previous timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout
    this.timeoutId = setTimeout(async () => {
      try {
        const results = await basicSearch(this.token, resumeId, query);
        callback(null, results);
      } catch (error) {
        callback(error, null);
      }
    }, this.delay);
  }

  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Example 12: Search Analytics Tracker
 * 
 * Track search analytics
 */
export class SearchAnalytics {
  constructor() {
    this.searches = [];
  }

  trackSearch(query, resumeId, results, duration) {
    this.searches.push({
      query,
      resumeId,
      resultCount: results.totalResults,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  getStats() {
    return {
      totalSearches: this.searches.length,
      avgResultCount:
        this.searches.reduce((sum, s) => sum + s.resultCount, 0) / this.searches.length,
      avgDuration: this.searches.reduce((sum, s) => sum + s.duration, 0) / this.searches.length,
      popularQueries: this.getMostPopularQueries(5),
    };
  }

  getMostPopularQueries(limit = 5) {
    const queryCounts = {};
    this.searches.forEach((search) => {
      queryCounts[search.query] = (queryCounts[search.query] || 0) + 1;
    });

    return Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }
}

export default {
  basicSearch,
  advancedSearch,
  multiResumeSearch,
  getSearchSuggestions,
  getSearchStats,
  searchWithErrorHandling,
  useResumeSearch,
  SearchHistoryManager,
  formatSearchResults,
  SearchComponent,
  DebouncedSearch,
  SearchAnalytics,
};
