# Project Proposal: Paper Tape, an AI Agent for Trading

## Title
Paper Tape: an educational trading decision-support app with a paper-trading portfolio.

## Overview
Paper Tape gathers market data, calculates a small set of documented indicators, explains the results in plain language with an AI component, and lets learners practise with hypothetical trades. It is built for education and demonstration only.

## Problem statement
Beginners who try to read market information face a scattered, jargon-heavy picture. Prices live on one site, indicators on another, and explanations on a third, often without showing how a number was calculated. Many tools also present signals with more confidence than the data supports, which teaches learners to follow arrows instead of understanding evidence.

Paper Tape brings selected market data, transparent calculations and plain-language explanations into one place, and adds a risk-free portfolio for practice. For every observation the learner can see the method and the values used.

**The project will:** show prices and statistics, calculate SMA, EMA, RSI and volatility, explain them, and record hypothetical trades.
**The project will not:** place real trades, connect to brokers, predict prices, guarantee returns, reduce risk, or give financial advice.

## Purpose and objectives
1. Help learners understand what common indicators measure and what they cannot tell.
2. Make every figure traceable: source, time, method and inputs are visible.
3. Offer safe practice through a persisted paper portfolio.
4. Demonstrate a clean full-stack design with graceful failure handling.

## Target users and market
**Primary:** students and beginner traders who want to learn to interpret market information. They need simple language, visible methods and a safe place to practise.
**Secondary:** educators and capstone evaluators who need to review the analysis, system behaviour and honesty of the claims.

Use cases: exploring an asset's recent behaviour, learning what RSI means, comparing a trend view with a risk view, practising a buy and sell and reviewing the result, and running a classroom demonstration without API keys.

## Proposed solution
A responsive web application (dashboard, portfolio, glossary) backed by a REST API. The API retrieves market data through a replaceable adapter, computes indicators on the server, generates explanations through an LLM with a rule-based fallback, and stores paper trades in a relational database. The app clearly labels data as live, cached, stale or simulated.

## Scope and limitations
In scope: 20 supported US stocks and ETFs, end-of-day data, SMA/EMA/RSI/volatility, AI or rule-based explanations, paper portfolio with average-cost accounting.
Out of scope: real trading, intraday data, accounts, fees and slippage, forecasting.
Limitations: free data tiers are small, indicators describe the past, and the demo portfolio is tied to a browser rather than to an account.
