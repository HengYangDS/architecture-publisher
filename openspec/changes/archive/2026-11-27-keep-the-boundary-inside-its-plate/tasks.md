## 1. Containment

- [x] 1.1 Bound the move that centres a figure's ink by its boundary's frame and its stroke, round the move inward,
      and count the frame in the check that nothing is drawn outside the plate; done when a plate whose boundary the
      move would take outside its plate keeps it and its stroke inside, in a test that fails without the change. The move that centres a figure's ink keeps its boundary and its stroke inside the plate, rounded inward, and the containment check counts the frame; the regression test fails without the change and passes with it.

## 2. Census, record and checks

- [x] 2.1 Build the published works' editions with this code and with dev's, from the same works, one ticket each;
      done when no boundary or its stroke lies past its plate's width and every plate whose move neither the
      boundary nor the rounding binds is as on dev. The published editions were built from the same works with this code and with dev's, one ticket each (2026-11-27 19:09:25 to 19:11:29 and 19:13:40 to 19:15:45): 11 of 12 each, ddwg-en refused by its front page's limit as on dev; 74 of 76 plates are recorded and drawn as on dev; the two that differ are the English Architecture Publisher models plate, whose boundary reached 20.5 px past its 1805 px width and now lies within it with its stroke, and the English Film Kit narration plate, whose cards reached 0.5 px past and now lie within; no boundary's stroke and no rect lies past any plate; the blank, crossing, route and matrix counts are as on dev.
- [x] 2.2 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 2.3 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
