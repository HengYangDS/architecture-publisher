## 1. Containment

- [ ] 1.1 Bound the move that centres a figure's ink by its boundary's frame and its stroke, round the move inward,
      and count the frame in the check that nothing is drawn outside the plate; done when a plate whose boundary the
      move would take outside its plate keeps it and its stroke inside, in a test that fails without the change.

## 2. Census, record and checks

- [ ] 2.1 Build the published works' editions with this code and with dev's, from the same works, one ticket each;
      done when no boundary or its stroke lies past its plate's width and every plate whose move neither the
      boundary nor the rounding binds is as on dev.
- [ ] 2.2 Record the change in the Changelog; done when its entry stands under the unreleased version.
- [ ] 2.3 Run the checks; done when every affected test and `npm run check:static` pass.
