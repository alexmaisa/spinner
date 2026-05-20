package rng

import (
	"crypto/rand"
	"math/big"
)

// GetSecureRandomInt returns a secure random integer in the range [min, max] (inclusive).
func GetSecureRandomInt(min, max int64) (int64, error) {
	if min > max {
		min, max = max, min
	}
	rangeSize := max - min + 1
	nBig, err := rand.Int(rand.Reader, big.NewInt(rangeSize))
	if err != nil {
		return 0, err
	}
	return nBig.Int64() + min, nil
}

// GetSecureRandomIndex returns a secure random index in the range [0, length-1].
func GetSecureRandomIndex(length int) (int, error) {
	if length <= 0 {
		return 0, nil
	}
	idx, err := GetSecureRandomInt(0, int64(length-1))
	if err != nil {
		return 0, err
	}
	return int(idx), nil
}

// GetSecureRandomWeightedIndex returns an index selected randomly based on a list of weights.
// If weights are empty, it returns a random index with equal probability.
func GetSecureRandomWeightedIndex(weights []float64) (int, error) {
	if len(weights) == 0 {
		return 0, nil
	}

	var totalWeight float64
	for _, w := range weights {
		if w < 0 {
			w = 0 // Ignore negative weights
		}
		totalWeight += w
	}

	if totalWeight <= 0 {
		// Fallback to uniform distribution if all weights are zero
		return GetSecureRandomIndex(len(weights))
	}

	// Generate a secure random float between 0 and totalWeight.
	// Since rand.Int works with integers, we scale the weight up to handle decimals precisely.
	const scale = 1000000
	scaledTotal := int64(totalWeight * scale)
	randomScaled, err := GetSecureRandomInt(0, scaledTotal)
	if err != nil {
		return 0, err
	}

	randomWeight := float64(randomScaled) / scale
	var currentSum float64
	for i, w := range weights {
		currentSum += w
		if randomWeight <= currentSum {
			return i, nil
		}
	}

	// Fallback in case of rounding errors
	return len(weights) - 1, nil
}
