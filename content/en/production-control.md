---
page_title: Production Control and Monitoring System — Case Study · Ekaterina Metelskaya
description: Rethinking complex user flows, cutting unnecessary steps, and making data easier to work with.
crumb: Production Control
badge: NDA
title: Production Control and Monitoring System
lead: Rethinking complex user flows, cutting unnecessary steps, and making data easier to work with.
result_num: ×8
result_label: Result
result_text: After a full redesign, the time needed to complete the main user task was reduced eightfold
facts:
  - Role: Product Designer
  - Scope: Redesign and ongoing improvements to an existing internal product
  - Methods: Product metrics analysis, interviews, prototype testing, informal usability tests, discussions with domain experts, feedback analysis
card_title: Production Control and Monitoring System
card_text: Rethinking complex user flows, cutting unnecessary steps, and making data easier to work with.
card_tags:
  - Redesign
  - Research
  - B2E
card_result: Main task completed 8× faster
---

## Context {#context}

I worked on redesigning an internal production control and monitoring system. The product had been growing for several years. As new features were added, the interface became more complicated too.

Users were spending extra time on routine tasks, searching through lots of interface elements to find what they needed, and sometimes fixing mistakes that could have been prevented during data entry.

[[context-pains]]

I needed to understand what was getting in their way, revisit existing design decisions, and make the system easier to use without losing the features people relied on.

## Where I started {#start}

First, I wanted to find out where users were losing time and which problems they ran into most often.

I looked at the available analytics: how long tasks took, where errors happened, how often users had to try again, and whether they finished what they started.

But the numbers didn't tell the whole story. I also spoke with users to understand why and where they struggled, and tested early ideas with prototypes.

Over time, I narrowed the work down to three main areas.

[[start-directions]]

## Making complex information easier to work with {#solution-1 label="Solution 01" toc="Working with complex information" sub="01"}

At first, I tried making the interface more compact and cutting unnecessary steps. But testing the first prototype showed that the problem was still there. Users still had to scroll through long pages and search among elements they didn't always need.

It became clear that simply showing fewer elements wasn't enough. I needed to rethink how the information was organised.

[[solution-1-fig]]

I grouped related elements and made it possible to expand sections only when needed. Users could also add or remove repeated input blocks themselves.

This made the interface more compact, and users no longer had to go through everything on the page just to find what they needed.

> **What I learned**
>
> Showing fewer elements doesn't always make an interface less complex. Sometimes changing how information is organised matters more than reducing how much of it is visible.

## Helping users avoid mistakes {#solution-2 label="Solution 02" toc="Preventing errors" sub="02"}

Another problem was errors when filling out forms. The interface didn't always help users spot missing or incorrect information in time. If something went wrong, the application could reset what they'd already entered, forcing them to start over.

I spoke with users to understand when these problems happened and clarified the requirements for the data they needed to enter.

[[solution-2-fig]]

I redesigned how the application handled data entry, adding input constraints, validation, and contextual hints. I placed error messages next to the relevant fields so users wouldn't have to search for the cause of a problem.

I also added a check for required fields when users tried to complete the flow. This helped catch missing information before they moved on.

Previously, a problem during form completion could cause the application to reset everything users had entered. I suggested adding drafts, so people could save their progress and come back to finish later.

> **What I learned**
>
> It's important to tell users when something goes wrong and help them understand how to fix it. Better still, help them avoid the mistake in the first place.

## Rethinking navigation {#navigation label="Solution 03" toc="Navigation" sub="03"}

In the old interface, users had to work with several menus. Some of them served overlapping purposes, making it harder to find the right sections.

[[navigation-fig]]

I reorganised the navigation and brought the separate menus together into one structure.

I tested the new navigation with users. They were able to find the sections they needed without having to choose between multiple menus. Still, some people found the new structure unfamiliar at first.

We kept collecting feedback after release. Once users had clear instructions, support requests related to the navigation change stopped coming in.

> **What I learned**
>
> Having trouble with a new interface at first doesn't always mean the design is wrong. Sometimes people just need time to get used to a change.

## Results {#results .finale}

[[results-finale-stat]]

We didn't judge the results by task completion time alone. After release, I continued gathering feedback through interviews and user support requests, as well as tracking the available product metrics.

The changes went beyond the visual design. I reworked the information structure, data-entry behaviour, and navigation while keeping the functionality users needed.

## What I took away {#learnings .finale}

When working on an existing product, it's important to think about users' habits as well as interface problems. Even inconvenient solutions become familiar over time, so changes can raise questions at first.

This project reminded me how important it is to test designs with users and keep listening after release. Testing helped uncover problems before development, while feedback after release showed how the changes worked in practice and what still needed improvement.
