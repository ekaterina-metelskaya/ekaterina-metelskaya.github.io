---
page_title: Corporate Planning System — Case Study · Ekaterina Metelskaya
description: How to build a new internal product for complex data and keep it easy to use as it grows.
crumb: Corporate Planning System
badge: NDA
title: Corporate Planning System
lead: How to build a new internal product for complex data and keep it easy to use as it grows.
result_num: ×3
result_label: Result
result_text: After launch, users could complete the workflow roughly 3 times faster
facts:
  - Role: Product Designer
  - Scope: Designing and evolving a new internal web product (0 → 1)
  - Methods: Working with business stakeholders, prototyping, comparative usability testing, observing users complete tasks, discussing solutions with users and the team
card_title: Corporate Planning System
card_text: How to build a new internal product for complex data and keep it easy to use as it grows.
card_tags:
  - 0 → 1
  - User research
  - B2E
card_result: Working with data — 3 times faster
---

## Context {#context}

I worked on an internal system for handling complex data. Before the product existed, people used separate spreadsheets that weren't always up to date. Bringing the information together, checking what was current, and making sure nothing was missed was difficult.

We were building the product from scratch. We needed to bring a large amount of information into one interface, show how the data was connected, and help users work with it without losing context.

As development went on, the project kept growing. New stakeholders would join presentations and realise they wanted to use the system for their own tasks, too. That gave the team a few extra headaches. We had to revisit the architecture, work out where the new data belonged, and avoid making things harder for people already using the product.

## Where I started {#start}

One of my first tasks was designing an interface for a large amount of connected data. I needed a structure that wouldn't send users jumping between a hundred tabs just to find what they needed.

Tables were the main challenge. There was a lot of data, much of it connected, and people in different roles needed different levels of detail.

I explored several ways to organise the interface and display the data. Before settling on the structure and table design, I tested the alternatives with users.

[[start-directions]]

## Making data easier to work with {#solution-1 label="Solution 01" toc="Working with data" sub="01"}

Our users were used to working in spreadsheets. Endless columns from A to CZ were nothing unusual, even if it was easy to get lost in them (and swear a little along the way).

One early idea was to move away from traditional tables and organise the information differently. But I didn't want to rule out a format users already knew, so I prepared several options, including wide tables and nested tables.

I wanted to find out which structure actually worked better for them. We tested the options using the same tasks, compared completion times, and observed how quickly people found the information they needed and where they got stuck.

[[solution-1-fig]]

Each approach had its pros and cons.

Wide tables felt familiar, but they kept many of the problems users already had in Excel. A completely unfamiliar structure put some test participants off at first. Choosing it might have meant a long adjustment period.

Users were sceptical about nested tables at first, too. But in practice, nested tables made it easier to show relationships between data and reveal details gradually without overwhelming the screen. People could navigate the information and find what they needed more easily.

Based on the comparison, I chose nested tables and continued designing the interface around that approach.

> **What I learned**
>
> A familiar interface isn't always the best fit for the task. It's worth testing users' first reactions through real scenarios rather than treating them as a final verdict.

## Too many changes {#solution-2 label="Solution 02" sub="02"}

Once data from different sources came together in one system, we faced another challenge. A change made in one part of the product could affect information elsewhere. And changes weren't always correct or made at the right time. There were also a lot of them.

So we started working out an approval process and status system that would account for different user roles.

We developed the approval logic together as a team, while I was responsible for how it would work in the interface.

We explored several ways to show changes: highlighting them directly in the data, comparing versions, using a separate list, and sending notifications. We needed something people could still use comfortably when there were lots of edits to review.

[[solution-2-fig]]

Before development, we ran several rounds of prototype testing. We tested scenarios with a large number of changes, then adjusted the layout and parts of the interaction based on what we observed.

In the end, we chose to show changes directly alongside the relevant data, with an option to approve them. We also added a change history for closer review.

> **What I learned**
>
> When designing an interaction, the number of tasks matters as much as the complexity of each one. Testing a single action isn't enough if users will have to repeat it dozens of times in practice.

## When the system starts to grow {#solution-3 label="Solution 03" toc="As the system grows" sub="03"}

As development continued, other related departments began using the product, each with its own tasks and frustrations. Their needs brought new requirements, extra sections, and changes to existing screens.

Some of the interface had already been built. We needed to fit new features into the existing structure without losing the logic users had learned.

One challenge was handling statuses. The new sections needed different sets of statuses. The way users interacted with them was much the same, but it was a bit like road and railway signals: they serve a similar purpose, yet use different sets of signals.

[[solution-3-fig]]

I revisited the structure of the new sections based on what users needed. For statuses, we were able to reuse existing components and change only the available states. That kept the interaction familiar and avoided extra work for the frontend developers.

I wasn't trying to make every screen look identical. What mattered more was keeping the interactions consistent so users could find their way around different parts of the system.

I worked through the options in prototypes, discussed them with the team, and showed them to business stakeholders. That helped us fit the new solutions into the product's existing structure.

> **What I learned**
>
> As a product grows, consistent interactions matter more than making every screen look the same. Shared components and patterns can support different tasks if you leave room for their differences.

## Results {#results .finale}

[[results-finale-stat]]

During the design stage, I tested key decisions with users, compared different interface options, and refined them based on the results. After launch, I kept collecting feedback to understand how well the system worked for people in practice.

We did more than bring scattered data into one product. We built an interface that could grow to support new tasks while keeping a consistent way of working.

## What I took away {#learnings .finale}

This project reminded me that when you build a product from scratch, you can't know every task it will need to support in the future. And that's okay.

What matters more is making decisions you can adapt as the product grows, testing your assumptions, and being willing to rethink an early approach when new requirements appear.

At the same time, flexibility shouldn't mean making the interface endlessly more complicated. You have to find a balance between new capabilities and what users already know.
