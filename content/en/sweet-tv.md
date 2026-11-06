---
page_title: SWEET.TV — Case Study · Ekaterina Metelskaya
description: Keeping the same user journey across devices controlled by touch and remote.
crumb: SWEET.TV
badge: Web · Mobile · Smart TV
title: SWEET.TV — Streaming on Mobile and Smart TV
lead: Keeping the same user journey across devices controlled by touch and remote.
points_label: Key outcomes
points:
  - Removed trailer autoplay while keeping the card expansion animation
  - Testing on a real TV helped improve readability and focus states
  - A shared UI kit made design work easier across Web, Mobile, and Smart TV
facts:
  - Role: Product Designer · Web, Mobile, Smart TV
  - Scope: Improving a product across multiple platforms
  - Methods: Reviewing user feedback and support requests, prioritization, prototyping, competitor analysis, testing on a real TV, design reviews
card_title: SWEET.TV
card_text: Keeping the same user journey across devices controlled by touch and remote.
card_tags:
  - Mobile
  - Smart TV
  - UI kit
---

## Context and my role {#context}

SWEET.TV is a streaming service for movies and live TV channels.

At first, I was the only designer at SWEET.TV, responsible for the interfaces across all six platforms: Web, iOS, Android, Android TV, Samsung Smart TV, and LG Smart TV.

[[context-case-result]]

A couple of years later, the team grew. I helped a new designer get familiar with the product and the different platforms, gradually handed over some of the web work, and focused on mobile apps and Smart TV.

I still took part in web design reviews, worked on our shared UI kit, and made sure the experience stayed consistent across platforms.

## How I found and prioritized tasks {#tasks toc="Finding and prioritizing tasks"}

Not every task came from the team. I found some problems myself by regularly reading reviews in app stores and on social media, as well as feedback passed on by customer support.

I looked for recurring complaints, bugs, and frustrating user journeys. I considered how serious each problem was, how often it happened, and what would improve for users if we fixed it.

I used different ways to prioritize work depending on whether it was a new feature or a bug fix. Most often, I used the Eisenhower Matrix and a value-versus-effort assessment. These helped me weigh importance and urgency, compare potential benefits with the work involved, and decide which improvements to suggest first.

[[tasks-fig]]

I discussed what I found with the team lead to align priorities and avoid duplicating work already in progress. Then I explored solutions in prototypes and discussed them with the team. Sometimes we had to rethink an idea because of technical limitations. Other ideas had to wait until priorities changed.

## TV guide and navigation across devices {#solution-1 label="Solution 01" toc="TV guide and navigation"}

One of the main things people did in SWEET.TV was watch live channels and use the TV guide to see what was on, catch up on past shows, or check upcoming programs. We needed this to work well on every platform, especially Smart TV and mobile.

On a phone, people tap the screen. On a TV, they move between elements with a remote. So I kept the overall user journey the same, but organized the interfaces differently.

**Mobile app.** On a small screen, I wanted to keep playback easy to reach without crowding the interface. I placed the TV guide below the player, where people could switch between genres, choose channels, and browse the schedule. They could also play a past show in the same player without opening another screen.

**Smart TV.** A larger screen can show more information at once, but too much detail can still get in the way. I placed the channel list and TV guide next to the video so people could see what was playing and what was coming next. I also had to account for remote control navigation, where even simple actions can take several button presses.

[[solution-1-fig]]

**Testing.** I studied how competitors handled navigation and took part in usability testing on a real TV. We found that people sometimes missed on-screen text and struggled to find recordings of past programs.

We couldn't find an alternative navigation approach that was clearly easier to use. Competitors' solutions had similar problems. After talking to users, we decided to keep the main navigation model and add tips and onboarding to help people understand the controls and features.

> **What I learned**
>
> The same user journey doesn't mean the same interface. People want to do the same thing on a phone and a TV, but the way they interact with each device is different. And when we couldn't find a clearer navigation model, we helped users make sense of the one we already had.

## Autoplay and the card expansion animation {#solution-2 label="Solution 02" toc="Trailer autoplay"}

In the early releases, I suggested automatically playing a trailer a few seconds after someone opened a movie card. An image in the top-right corner would smoothly expand to fill the screen, and the trailer would start.

We ran several tests, and the reaction was mixed. People liked the animation, but not everyone wanted the video to start on its own. Some wanted to read the movie description first, others were still deciding what to watch. Someone might have stepped away from the TV, and others found the sudden sound startling, even with the volume gradually increasing.

[[solution-2-fig]]

We also looked into the technical side. We found that most of our users had slow internet connections or expensive mobile data. So we checked how much data automatic trailer loading used and how it affected app performance. That gave us another reason to remove autoplay.

In the end, we kept the expansion animation but let users decide when to play the trailer. Until they press the “Trailer” button, the card shows a still image, usually a frame from the movie.

> **What I learned**
>
> Even a nice animation can be annoying when it happens at the wrong time. People liked the effect, but not the app deciding when they should start watching.

## Readability on TV {#solution-3 label="Solution 03" toc="TV readability"}

Working on Smart TV quickly showed me that an interface that looks clear on a computer monitor doesn't always work as well on a television. Text is harder to read from a distance, and some element states become difficult to tell apart.

In the early releases, we used a gradient highlight to show which element was in focus. It came from another product and worked well on dark backgrounds. But SWEET.TV had its own twist: a TV channel was already playing in the corner of the screen.

Gradients were popular in interface design at the time, but here they often got in the way. Against a moving video, text could blend into the background, especially when viewed from a sofa.

I redesigned focus states and text styling to fit the brand. I experimented with colors and contrast, removed gradients where they made text harder to read, and checked whether different element states were easy to recognize.

[[solution-3-fig]]

I tested the designs on a real TV from different distances, both with and without my glasses. I also used color-vision simulators. If text disappeared against the video or states were hard to distinguish, I went back to the designs and adjusted them. Over time, I found solutions that worked better in different viewing conditions.

> **What I learned**
>
> This taught me not to trust how an interface looks in a design file too much. Now I try to test on real devices as early as possible. Something that looks perfectly readable at arm's length can look very different from the sofa.

[[solution-3-svg]]

## UI kit and localization {#solution-4 label="Solution 04" toc="UI kit and localization"}

After the team moved from Photoshop to Figma, I started building a shared UI kit for SWEET.TV's different platforms. I added styles, reusable components, and their states, gradually expanding the library as the product and Figma itself evolved.

The UI kit made it easier to prepare designs and update them. When creating components, I also tried to account for localization so they could handle different text lengths without needing to be rebuilt each time.

[[solution-4-fig]]

I used the Lokalise plugin for Figma to check translations. It let me put real translations into the designs and see how they behaved in the interface. Buttons, movie titles, and long subscription plan names caused the most trouble.

We could catch and fix some of these issues during design, before handing the screens over to development.

[[solution-4-fig-2]]

## Working with the team {#team}

As the team grew, I spent more time working on interfaces with other designers. We discussed solutions together, I helped colleagues understand the product, and I continued taking part in design reviews even after I stopped working directly on the web experience.

I also reviewed web designs and graphics made from templates, checking that new work fit the product's visual style and that mistakes didn't make it into a release.

## Results {#results .finale}

During my time at SWEET.TV, I went from designing the interfaces for every platform on my own to working as part of a larger design team, with a focus on mobile apps and Smart TV.

Not all of our early ideas worked well in practice, and some needed to change. After testing with users, we removed trailer autoplay but kept the movie card expansion animation. Testing on a real TV also helped me find readability problems and improve focus states.

The shared UI kit made designers' work noticeably easier. We no longer had to build the same elements from scratch every time, and it became easier to keep changes consistent across platforms. We didn't copy components exactly from one platform to another, though. We adapted them to suit Web, Mobile, and Smart TV.

## What I took away {#learnings .finale}

SWEET.TV was an important part of my growth as a designer. Working across several platforms taught me how to prioritize. We looked at device usage statistics, spent more time refining the platforms with the largest audiences, and started with an MVP on the others before building them out further.

My approach to testing ideas changed over time, too. I used to think almost every idea needed testing. Now I'm better at recognizing which ideas are worth exploring and which can be ruled out earlier. I've also learned many more ways to test them.

But I think the most important lesson came after I'd left the project. When you work on the same product for a long time, you get used to it. It becomes harder to spot problems in familiar solutions, and sometimes you really need a fresh pair of eyes. I try to keep that in mind and not rush to defend my own work when someone suggests looking at it differently.
