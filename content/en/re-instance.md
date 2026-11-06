---
page_title: Re:Instance · Case Study · Ekaterina Metelskaya
description: A Figma plugin for finding detached components, analyzing changes, identifying possible source components, and restoring instances.
crumb: Re:Instance
badge: Figma Plugin · Personal Project
title: Re:Instance: A Figma Plugin
lead: A Figma plugin for finding detached instances, analyzing changes, and identifying opportunities to improve design systems.
result_num: 1 hour
result_label: Potential time saved
result_text: When analyzing 20 detached frames compared to manually finding and comparing changes. Preliminary estimate, not yet validated with users.
facts:
  - Role: Product Designer, Product Creator
  - Development: AI-assisted development
  - Scope: Independent Figma plugin, from concept to publication
  - Methods: User workflow analysis, interface design, prototyping, AI-assisted development, functional testing
  - Status: Under Figma Community review
card_title: Re:Instance
card_text: A Figma plugin for analyzing detached components, spotting recurring changes, and restoring instances.
card_tags:
  - Plugin
  - Design system
  - TS
---

## About the project {#about}

While working with existing design systems, I often found that components didn't cover everything I needed for a particular task. I had to detach instances and edit them manually. At the same time, I had very little direct contact with the team maintaining the library. It wasn't easy to explain what was missing or how often designers ran into the same limitations.

I also thought about the people building design systems. When a file contains dozens of detached frames, reviewing them by hand takes too long. You have to find each one, compare it with the original component, and work out which changes keep coming up.

That's how Re:Instance started. The plugin helps uncover what happens to components after detachment and collect concrete examples to discuss with the design system team.

## What I wanted to build {#goal}

My original goal was to automate the search for detached instances and analyze changes by source component. If a file contains many detached copies of the same component, counting them isn't enough. I wanted to understand what designers had changed.

Designers could use specific examples to explain problems to the library team, even if they rarely spoke directly. Design system developers could spot recurring changes without comparing every frame manually.

Later, I added compatibility checks, instance restoration, and a way to find possible sources for components that had lost their library connection. But the underlying idea stayed the same: **detaching an instance doesn't automatically mean the component is flawed**. Sometimes the right property already exists. In other cases, the component really doesn't support the scenario a designer needs.

## Try Re:Instance {#demo}

The interactive playground embedded on this page lets you try the main workflows with sample data: run a scan, open a detached frame, compare it with its source component, explore the summary, and try restoring an instance.

[[re-instance-playground]]

The playground runs directly on this portfolio page, without connecting to Figma. It uses prepared sample data, doesn't modify any real files, and doesn't inspect visitors' documents.

## Search at the right scope {#scan label="Decision 01" toc="Detached frame search" sub="01"}

The scan needed to work for both a quick check of a single screen and a large file. I added three scopes: the current selection, the current page, and the entire file.

The plugin lists detached frames and local main components. Findings are grouped by source component, with each frame's location and comparison status shown in the results. Search by name and filters help when someone needs to inspect a particular element.

I also considered empty results and unavailable sources. If a source component has been deleted or its library isn't accessible, the frame stays in the list with an explanation of why it can't be compared yet.

## Show what changed, not just what was detached {#comparison label="Decision 02" toc="Change analysis" sub="02"}

Finding a detached frame is only the start. You also need to see exactly what changed. I decided to compare each frame with the **current version** of its source component.

The plugin checks five categories: content, appearance, tokens, layout, and structure. Differences appear in "In component / In frame" cards, so users don't have to inspect raw properties themselves. Repeated identical changes are grouped together, with details available when needed.

I added two previews at the same scale for visual comparison. Clicking a difference takes you to the relevant layer on the Figma canvas. Layer renames can be hidden so they don't distract from more significant changes.

The comparison uses the component as it exists now. This method can't show what it looked like when the instance was detached.

## Separate supported changes from real issues {#verdict label="Decision 03" toc="Compatibility assessment" sub="03"}

Not every difference means the component needs to be redesigned. Text can be changed through a Text property, visibility through a Boolean property, and nested elements through Instance swap. If someone detached an instance to make one of these changes, the library might already support what they needed.

So I added a comparison verdict. The interface uses four statuses: **"No losses"**, **"Overrides"**, **"Critical"**, and **"Source unavailable"**.

The verdict helps users see whether changes can be transferred back to an instance, which differences need a separate decision, and when there isn't enough information to assess the frame. For example, adding or rearranging layers isn't treated like a simple text override. Even changes made inside a slot aren't always safe to reproduce automatically.

I didn't want the plugin to suggest it could fix every detached component with one click.

## Gather evidence to improve the library {#insights label="Decision 04" toc="Component analytics" sub="04"}

The number of detached instances alone doesn't explain why people detach them. In the component summary, I brought together frame verdicts, frequently edited elements, and recurring patterns.

For example, if the same layer is hidden across several frames, the component might need a Boolean property. If designers keep adding elements, a slot might help. Repeated spacing changes could point to a layout that isn't flexible enough.

The plugin generates **hypotheses**, not definitive diagnoses. A pattern must appear in at least two comparable frames and account for at least 30% of that component's comparable detached frames. Each hypothesis links to examples, so the team can decide whether the component needs to change.

This gives designers concrete evidence for conversations with the design system team. The plugin shows the file's current state; it doesn't track growth in detachments over time.

## Restore instances without losing control {#restore label="Decision 05" toc="Restoring instances" sub="05"}

Later, I started exploring whether a detached frame could be linked back to its component when the changes were compatible with instance overrides.

For eligible frames, I added instance restoration that carries over supported changes. If the source belongs to a variant set, the plugin can check whether another variant is a better match and use it for restoration.

I paid particular attention to safety. The user confirms the replacement first. The original frame isn't deleted; it's hidden next to the new instance, and the operation can be undone. If some properties can't be transferred, the plugin warns the user before proceeding.

I also added a way to restore bindings to component variables and styles. Rebinding can change how a frame looks, so the plugin shows a "before → after" preview of affected values.

## When Figma loses the source {#limitations label="Decision 06" toc="Finding the source component" sub="06"}

Finding a regular detached frame is relatively straightforward: Figma retains its origin in `detachedInfo`. It's harder when someone turns that detached frame into a new main component. At that point, the original link is no longer available through the API.

I decided to look for **possible** sources using other signals: component and layer names, structure, tokens, and appearance. For a local main component with no associated detached frames, the plugin can suggest similar library components that have instances in the file.

But similarity doesn't prove that one component came from another. Matches are therefore presented as suggestions, not confirmed relationships. Users can inspect why two components look similar, compare them, and then confirm the source themselves. The plugin never replaces anything based on a suggestion alone.

Fully automatic identification wouldn't be reliable here, so I left the final decision to the user.

## Work around library access limits {#catalog label="Decision 07" toc="Library catalog" sub="07"}

The similarity search revealed another limitation: the Figma Plugin API doesn't let a plugin simply list every component in a connected library. If the file contains no instance of a particular component, a regular scan can't find it.

To address this, I built a **library catalog** workflow. From the library file itself, users can create a lightweight description of its components and then connect that catalog in a working file. It stores the information needed for an initial comparison and makes it possible to find candidates that a regular scan would miss.

A catalog match still isn't proof of origin. The user reviews the suggested pair and confirms the connection. The catalog doesn't update automatically either; it needs to be exported again when the library changes.

The catalog is included in version 1.0. I tested it with sample data, in the browser preview, and with a real Figma library.

## Keep context in a small window {#interface label="Decision 08" toc="Interface and navigation" sub="08"}

I needed to fit scan results, component summaries, and detailed comparisons into Figma's small plugin window.

I chose two navigation layouts. In a compact window, users move between the results list, summary, and details. In a wider window, the list stays on the left while the selected item opens on the right. The window can be resized without losing saved preferences.

I also connected plugin navigation with the Figma canvas. Selecting a frame or component in Figma opens its details in the plugin, while selecting a result takes you to the relevant layer on the canvas. This makes it easier to inspect changes in the actual design.

For larger files, scanning runs in batches and comparisons load progressively so the results remain usable during analysis. I also added light and dark themes, along with English and Russian interfaces.

## Results and next steps {#learnings .finale toc="Results"}

I built the first version of Re:Instance and submitted it for review in Figma Community. It includes detached-frame search, comparison with current components, recurring-change analysis, compatibility checks, instance restoration, and tools for identifying possible sources.

This is the first Figma plugin I've developed independently. I used AI tools during development and gained a deeper understanding of what the Figma API can and can't do. I paid particular attention to making changes safely and keeping users in control of the plugin's actions.

I don't have usage data from other designers yet, so it's too early to claim time savings. After release, I plan to collect feedback and see which workflows are most useful and which need another look.
