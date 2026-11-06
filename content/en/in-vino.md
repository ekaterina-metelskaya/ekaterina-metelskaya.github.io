---
page_title: In Vino — Case Study · Ekaterina Metelskaya
description: My own design system, used to build this portfolio: layered tokens, slots, and component properties.
crumb: In Vino
badge: Design system · Figma
title: In Vino — Design System
lead: My own component library, used to build this portfolio. It relies on layered tokens, slots, and component properties instead of unnecessary variants.
facts:
  - Role: Design system creator
  - Format: Personal Figma project; used to build this portfolio
card_title: In Vino
card_text: My own design system, used to build this portfolio: layered tokens, slots, and component properties.
card_tags:
  - Design system
  - Figma
  - Tokens
---

## About the project {#about}

Over the years, I've worked with different design systems, including Consta, Ant Design, Tailwind, Carbon, and Material Design. I found useful ideas in each of them, but none quite matched what I wanted from a component library.

That's what led me to build my own design system. I wanted a tool I'd enjoy working with and could reuse in future projects.

In Vino became that foundation. I'm using it to build my portfolio and plan to use it for other small products. I'm also still developing the system itself, revisiting decisions and exploring new Figma features.

## What I wanted to do differently {#different}

When working with existing design systems, I often ran into component limitations. This was especially noticeable with tables and other data-heavy elements. Changing the content of a cell or card to fit a specific task wasn't always possible without detaching the instance.

Other components came with different problems. Some had so many variants that finding the right one took time, while others were missing even basic states, like Hover.

With In Vino, I tried to find a balance between flexibility and ease of use. I used slots and component properties to customize content, keeping variants for states and differences that really need them.

I also paid particular attention to tokens. I wanted a variable structure from the start, so I could manage visual styles centrally instead of updating every component by hand.

## Token architecture {#tokens}

Before building the library, I spent time exploring Figma Variables. I read the documentation, looked at examples, and compared different ways of organizing tokens.

I eventually settled on a layered structure. At the base are primitive tokens for colors, sizes, typography, and other values. Semantic tokens build on those primitives and are grouped by purpose.

The system supports light and dark themes. Interface density can be switched between Default, Compact, and Comfortable. Separate collections cover typography, sizing, shapes, and motion.

The final layer contains component tokens. They inherit values from the semantic layer, letting me adjust individual components without changing the whole system.

[[tokens-fig]]

The structure is still flexible. I can add new modes, extend collections, or rethink the relationships between tokens when needed.

## Component architecture {#components}

I took a compositional approach to building the library. I started with basic elements and used them to create more complex components.

I usually keep nesting to three levels. This makes elements easier to reuse and components easier to update.

[[components-iv-stats]]

I used different Figma features to make content customizable. Variants and properties handle predefined states and settings. Where content needs more flexibility, I use slots.

This has been particularly useful for tables, cards, menus, and lists. For example, I can swap a nested component inside a table cell or change what's in it without detaching the instance from the library.

[[components-fig]]

[[components-fig-2]]

[[components-fig-3]]

[[components-fig-4]]

## Working with states {#states}

I defined a basic set of states for interactive components. But as I started using the library, I came across situations I'd missed at first.

For example, a card in its Active state still needs a Hover state. I only noticed this while working with the components, so I had to expand the set of states.

[[states-fig]]

[[states-fig-2]]

I'm currently the main user of In Vino and keep improving it as new needs come up. Later, I'd like to share the library with other designers and get their feedback.

## Visual language {#visual}

Choosing the color palette took the most time. Over several months, I experimented with shades and combinations, trying to find a palette that felt balanced and worked well across different screens.

I also wanted the main accent color to stay distinct from status colors. I chose purple because it works with the rest of the palette without being confused with success, warning, or error colors.

[[visual-fig]]

I took a more practical approach to spacing and corner radii, drawing on common interface design conventions. Typography was easier to settle on: I chose IBM Plex Sans and IBM Plex Mono.

[[visual-fig-2]]

[[visual-fig-3]]

The result is a set of visual rules I can use as a starting point for new interfaces.

## Putting it to use {#practice}

My portfolio was the first project I built with In Vino. I use the library to design the website and, at the same time, see how well its components hold up in real layouts.

[[practice-fig]]

As I work, new tasks reveal limitations in existing solutions and give me reasons to improve the system.

I also plan to use In Vino for other personal projects, including interfaces for Figma plugins.

[[practice-fig-2]]

## What I've learned and what's next {#learnings .finale toc="What's next"}

In Vino is growing alongside the projects I build with it. Right now, I'm the library's main user, so I can test decisions in my own work and gradually improve anything that turns out to be awkward.

Eventually, I'd like to make the system available to other designers and collect feedback. I'm curious to see how clear and useful it feels outside my own workflows.
