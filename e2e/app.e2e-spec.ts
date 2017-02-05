import { TechRadarBuilderPage } from './app.po';

describe('tech-radar-builder App', function() {
  let page: TechRadarBuilderPage;

  beforeEach(() => {
    page = new TechRadarBuilderPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
