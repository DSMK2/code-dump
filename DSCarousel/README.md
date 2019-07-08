# DSCarousel

A "carousel" implementation that uses CSS transforms and math. Attempts to approach element progression in a more controlled manner than DOM shifting / element repositioning.

## Creating a DSCarousel
This requires a HTML layout with a main carousel element, with any number of children:

```
<div class="carousel">
  <div class="child"></div>
  <div class="child"></div>
  <div class="child"></div>
  ...
</div>
```

At the most basic use, you create the carousel with:
```
var carousel = new DSCarousel(document.querySelector('.carousel'));
```

## Using a DSCarousel

- `carousel.next()`

Moves the carousel to the next slide.

- `carousel.previous()`

Moves the carousel to the Previous slide.

- `carousel.goto(slideIndex)`

Moves the carousel to the specified slide.

- `carousel.build(dryRun)`

Lays out elements in the carousel into a circle. If dryRun is passed into the, the carousel won't be built, but the function will return where each slide should be (for animation!).

## Events from DSCarousel

- `DSCarousel.progress`

Invoked whenever the carousel changes index.

- `DSCarousel.build`

Invoked whenever the carousel successfully completes layout for each of its children.

## Todo(s):
- Testing via implementation
- Better documentation
- Scope matrix math functions
