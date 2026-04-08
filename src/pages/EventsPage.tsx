import { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { TitleHeader } from '../components/TitleHeader';
import { Footer } from '../components/Footer';
import { EventBrowseFilter } from '../components/EventBrowseFilter';
import { FolderEventCard } from '../components/FolderEventCard';
import { allMockEvents, SHOW_EVENTS } from '../data/mockEvents';
import { useNavigate } from 'react-router-dom';

import './guestHome.mobile.css';
import './mobileSearchFix.css';

export function EventsPage() {
  const navigate = useNavigate();

  // Filters States
  const [country, setCountry] = useState('Sweden');
  const [city, setCity] = useState('All');
  const [period, setPeriod] = useState('Recent');

  // Filter Logic
  const filteredEvents = useMemo(() => {
    const source = allMockEvents;

    // Date Parsing Helper (Mock specific)
    const parseEventDates = (periodStr: string) => {
      try {
        const todayMock = new Date('2026-01-21T00:00:00');
        const currentYear = todayMock.getFullYear();
        const parts = periodStr.split('–').map(s => s.trim());

        let start, end;
        if (parts.length === 2) {
          let startStr = parts[0];
          let endStr = parts[1];
          // Append year if missing
          if (!startStr.match(/\d{4}/)) startStr += ` ${currentYear}`;
          if (!endStr.match(/\d{4}/)) endStr += ` ${currentYear}`;

          start = new Date(startStr);
          end = new Date(endStr);
        } else {
          let dateStr = parts[0];
          if (!dateStr.match(/\d{4}/)) dateStr += ` ${currentYear}`;
          start = new Date(dateStr);
          end = new Date(dateStr);
        }

        // Normalizing times
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return { start, end };
      } catch {
        // Fallback for safety
        return { start: new Date('2099-01-01'), end: new Date('2099-01-01') };
      }
    };

    const TODAY = new Date('2026-01-21T00:00:00');
    TODAY.setHours(0, 0, 0, 0);

    const results = source.filter(event => {
      const matchCountry = event.country === country || country === 'all';
      const matchCity = city === 'All' || city === 'all' || event.city === city;

      // Period Logic
      let matchPeriod = true;
      const { start, end } = parseEventDates(event.period);

      // Is Live? (Today is within range)
      const isLive =
        TODAY.getTime() >= start.getTime() && TODAY.getTime() <= end.getTime();

      if (period === 'Recent') {
        // Rules:
        // 1. Started within last 30 days: start >= (TODAY - 30) AND start <= TODAY
        // 2. OR is Live (covers long events started > 30 days ago potentially, though unlikely in mock)
        // 3. NO future events (start > TODAY) — unless live.

        const thirtyDaysAgo = new Date(TODAY);
        thirtyDaysAgo.setDate(TODAY.getDate() - 30);

        const startedRecently = start >= thirtyDaysAgo && start <= TODAY;

        matchPeriod = startedRecently || isLive;
      } else if (period === 'Scheduled') {
        // Rules:
        // 1. Upcoming: start > TODAY
        matchPeriod = start > TODAY;
      }

      return matchCountry && matchCity && matchPeriod;
    });

    // Sorting & Limiting for Recent
    let finalResults = results.sort((a, b) => {
      const datesA = parseEventDates(a.period);
      const datesB = parseEventDates(b.period);

      if (period === 'Recent') {
        // Most recent first (Descending by start date)
        return datesB.start.getTime() - datesA.start.getTime();
      } else if (period === 'Scheduled') {
        // Soonest first (Ascending by start date)
        return datesA.start.getTime() - datesB.start.getTime();
      }
      return 0;
    });

    if (period === 'Recent') {
      // Separate Live vs Others
      const liveEvents = finalResults.filter(e => {
        const { start, end } = parseEventDates(e.period);
        return (
          TODAY.getTime() >= start.getTime() && TODAY.getTime() <= end.getTime()
        );
      });

      const otherEvents = finalResults.filter(e => {
        const { start, end } = parseEventDates(e.period);
        return !(
          TODAY.getTime() >= start.getTime() && TODAY.getTime() <= end.getTime()
        );
      });

      // Take All Live + Top 10 Others
      finalResults = [...liveEvents, ...otherEvents.slice(0, 10)];

      // Re-sort to maintain date order if needed, but usually Live are recent anyway.
      // But prompt says "Recent should have only live and other 10 cards" "Sort by period"
      // So we re-sort the combined list.
      finalResults.sort((a, b) => {
        const datesA = parseEventDates(a.period);
        const datesB = parseEventDates(b.period);
        return datesB.start.getTime() - datesA.start.getTime();
      });
    }

    if (period === 'Scheduled') {
      // Limit to 3 items as per prototype request
      finalResults = finalResults.slice(0, 3);
    }

    return finalResults;
  }, [country, city, period]);

  const handleFilterChange = (
    key: 'country' | 'city' | 'period',
    value: string,
  ) => {
    if (key === 'country') setCountry(value);
    if (key === 'city') setCity(value);
    if (key === 'period') setPeriod(value);
  };

  return (
    <div className="page-wrapper ehome-page guestHome">
      <Header />

      <div className="ehome-intro-inner">
        <TitleHeader
          title="Your best moments, captured"
          description="We capture horse competitions across Sweden. Search your event, spot your photos, and purchase your favorites."
          variant="ehome"
        />
      </div>

      <section className="grid-section">
        <div className="container">
          <h2 className="section-title">Browse events</h2>
          <div className="filters-wrapper">
            <EventBrowseFilter
              country={country}
              city={city}
              period={period}
              onFilterChange={handleFilterChange}
              isSticky={false}
              resultsCount={filteredEvents.length}
            />
          </div>

          {SHOW_EVENTS ? (
            <div className="events-folders-grid">
              {filteredEvents.map(event => (
                <FolderEventCard
                  key={event.id}
                  event={event}
                  onClick={id => navigate(`/event/${id}`)}
                  forceDisabled={period === 'Scheduled'}
                />
              ))}
            </div>
          ) : (
            <div className="pg-empty-state">
              <h3>No events available – yet</h3>
            </div>
          )}
        </div>
      </section>
      <Footer minimal={false} />
    </div>
  );
}
