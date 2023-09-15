import {
  urlJoinWithRelative,
  buildAudioUrlWithTracking,
  PUBLIC_URLS,
  secondsToHHMMSS,
  htmlToPlainText
} from "../../common-src/StringUtils";
import { humanizeMs, msToRFC3339 } from "../../common-src/TimeUtils";
import { ENCLOSURE_CATEGORIES, ITEM_STATUSES_DICT, STATUSES } from "../../common-src/Constants";
import { isValidMediaFile } from "../../common-src/MediaFileUtils";

const { yaar_VERSION } = require('../../common-src/Version');

export default class FeedPublicJsonBuilder {
  constructor(content, baseUrl, request, forOneItem = false) {
    this.content = content;
    this.settings = content.settings || {};
    this.webGlobalSettings = this.settings.webGlobalSettings || {};
    this.publicBucketUrl = this.webGlobalSettings.publicBucketUrl || '';
    this.baseUrl = baseUrl;
    this.forOneItem = forOneItem;
    this.request = request;
  }

  _decorateForItem(item, baseUrl) {
    item.webUrl = PUBLIC_URLS.webItem(item.id, item.title, baseUrl);
    item.jsonUrl = PUBLIC_URLS.jsonItem(item.id, null, baseUrl);
    item.rssUrl = PUBLIC_URLS.rssItem(item.id, null, baseUrl);

    // Try our best to use local time of a website visitor
    const timezone = this.request.cf ? this.request.cf.timezone : null;
    item.pubDate = humanizeMs(item.pubDateMs, timezone);
    item.pubDateRfc3339 = msToRFC3339(item.pubDateMs);
    item.descriptionText = htmlToPlainText(item.description);

    if (item.image) {
      item.image = urlJoinWithRelative(this.publicBucketUrl, item.image);
    }
    if (isValidMediaFile(item.mediaFile)) {
      item.mediaFile.isAudio = item.mediaFile.category === ENCLOSURE_CATEGORIES.AUDIO;
      item.mediaFile.isDocument = item.mediaFile.category === ENCLOSURE_CATEGORIES.DOCUMENT;
      item.mediaFile.isExternalUrl = item.mediaFile.category === ENCLOSURE_CATEGORIES.EXTERNAL_URL;
      item.mediaFile.isVideo = item.mediaFile.category === ENCLOSURE_CATEGORIES.VIDEO;
      item.mediaFile.isImage = item.mediaFile.category === ENCLOSURE_CATEGORIES.IMAGE;

      if (!item.mediaFile.isExternalUrl) {
        item.mediaFile.url = urlJoinWithRelative(this.publicBucketUrl, item.mediaFile.url);
      }
    }
  }

  _buildPublicContentChannel() {
    const channel = this.content.channel || {};
    const publicContent = {};
    publicContent['title'] = channel.title || 'untitled';

    if (channel.link) {
      publicContent['home_page_url'] = channel.link;
    }

    publicContent['feed_url'] = PUBLIC_URLS.jsonFeed(this.baseUrl);

    if (this.content.items_next_cursor && !this.forOneItem) {
      publicContent['next_url'] = `${publicContent['feed_url']}?next_cursor=${this.content.items_next_cursor}&` +
        `sort=${this.content.items_sort_order}`;
    }

    publicContent['description'] = channel.description || '';

    if (channel.image) {
      publicContent['icon'] = urlJoinWithRelative(this.publicBucketUrl, channel.image, this.baseUrl);
    }

    if (this.webGlobalSettings.favicon && this.webGlobalSettings.favicon.url) {
      publicContent['favicon'] = urlJoinWithRelative(
        this.publicBucketUrl, this.webGlobalSettings.favicon.url, this.baseUrl);
    }

    if (channel.publisher) {
      publicContent['authors'] = [{
        'name': channel.publisher,
      }];
    }

    if (channel.language) {
      publicContent['language'] = channel.language;
    }

    if (channel['itunes:complete']) {
      publicContent['expired'] = true;
    }
    return publicContent;
  }

  _buildPublicContentyaarExtra(publicContent) {
    const channel = this.content.channel || {};
    const subscribeMethods = this.settings.subscribeMethods || { 'methods': [] };
    const yaarExtra = {
      yaar_version: yaar_VERSION,
      base_url: this.baseUrl,
      categories: [],
    };
    const channelCategories = channel.categories || [];
    channelCategories.forEach((c) => {
      const topAndSubCats = c.split('/');
      let cat;
      if (topAndSubCats) {
        if (topAndSubCats.length > 0) {
          cat = {
            'name': topAndSubCats[0].trim(),
          };
        }
        if (topAndSubCats.length > 1) {
          cat['categories'] = [{
            'name': topAndSubCats[1].trim(),
          }]
        }
      }
      if (cat) {
        yaarExtra['categories'].push(cat);
      }
    });
    if (!subscribeMethods.methods) {
      yaarExtra['subscribe_methods'] = '';
    } else {
      yaarExtra['subscribe_methods'] = subscribeMethods.methods.filter((m) => m.enabled).map((m) => {
        // TODO: supports custom icons that are hosted on R2
        m.image = urlJoinWithRelative(this.publicBucketUrl, m.image, this.baseUrl);
        if (!m.editable) {
          switch (m.type) {
            case 'rss':
              m.url = PUBLIC_URLS.rssFeed(this.baseUrl);
              return m;
            case 'json':
              m.url = PUBLIC_URLS.jsonFeed(this.baseUrl);
              return m;
            default:
              return m;
          }
        }
        return m;
      });
    }
    yaarExtra['description_text'] = htmlToPlainText(channel.description);

    if (channel['itunes:explicit']) {
      yaarExtra['itunes:explicit'] = true;
    }
    if (channel['itunes:title']) {
      yaarExtra['itunes:title'] = channel['itunes:title'];
    }
    if (channel['copyright']) {
      yaarExtra['copyright'] = channel['copyright'];
    }
    if (channel['itunes:title']) {
      yaarExtra['itunes:title'] = channel['itunes:title'];
    }
    if (channel['itunes:type']) {
      yaarExtra['itunes:type'] = channel['itunes:type'];
    }
    if (channel['itunes:block']) {
      yaarExtra['itunes:block'] = channel['itunes:block'];
    }
    if (channel['itunes:complete']) {
      yaarExtra['itunes:complete'] = channel['itunes:complete'];
    }
    if (channel['itunes:new-feed-url']) {
      yaarExtra['itunes:new-feed-url'] = channel['itunes:new-feed-url'];
    }
    if (channel['itunes:email']) {
      yaarExtra['itunes:email'] = channel['itunes:email'];
    }
    yaarExtra['items_sort_order'] = this.content.items_sort_order;
    if (this.content.items_next_cursor && !this.forOneItem) {
      yaarExtra['items_next_cursor'] = this.content.items_next_cursor;
      yaarExtra['next_url'] = publicContent['next_url'];
    }
    if (this.content.items_prev_cursor && !this.forOneItem) {
      yaarExtra['items_prev_cursor'] = this.content.items_prev_cursor;
      yaarExtra['prev_url'] = `${publicContent['feed_url']}?prev_cursor=${this.content.items_prev_cursor}&` +
        `sort=${this.content.items_sort_order}`;
    }
    return yaarExtra;
  }

  _buildPublicContentItem(item, mediaFile) {
    let trackingUrls = [];
    if (this.settings.analytics && this.settings.analytics.urls) {
      trackingUrls = this.settings.analytics.urls || [];
    }

    const newItem = {
      id: item.id,
      title: item.title || 'untitled',
    };
    const attachment = {};
    const _yaar = {
      is_audio: mediaFile.isAudio,
      is_document: mediaFile.isDocument,
      is_external_url: mediaFile.isExternalUrl,
      is_video: mediaFile.isVideo,
      is_image: mediaFile.isImage,
      web_url: item.webUrl,
      json_url: item.jsonUrl,
      rss_url: item.rssUrl,
      guid: item.guid,
      status: ITEM_STATUSES_DICT[item.status] ? ITEM_STATUSES_DICT[item.status].name : 'published',
    };

    if (isValidMediaFile(mediaFile)) {
      if (mediaFile.url) {
        attachment['url'] = buildAudioUrlWithTracking(mediaFile.url, trackingUrls);
      }
      if (mediaFile.contentType) {
        attachment['mime_type'] = mediaFile.contentType;
      }
      if (mediaFile.sizeByte) {
        attachment['size_in_byte'] = mediaFile.sizeByte;
      }
      if (mediaFile.durationSecond) {
        attachment['duration_in_seconds'] = mediaFile.durationSecond;
        _yaar['duration_hhmmss'] = secondsToHHMMSS(mediaFile.durationSecond);
      }
      if (Object.keys(attachment).length > 0) {
        newItem['attachments'] = [attachment];
      }
    }
    if (item.link) {
      newItem['url'] = item.link;
    }
    if (mediaFile.isExternalUrl && mediaFile.url) {
      newItem['external_url'] = mediaFile.url;
    }

    newItem['content_html'] = item.description || '';
    newItem['content_text'] = item.descriptionText || '';

    if (item.image) {
      newItem['image'] = item.image;
    }
    if (mediaFile.isImage && mediaFile.url) {
      newItem['banner_image'] = mediaFile.url;
    }
    if (item.pubDateRfc3339) {
      newItem['date_published'] = item.pubDateRfc3339;
    }
    if (item.updatedDateRfc3339) {
      newItem['date_modified'] = item.updatedDateRfc3339;
    }
    if (item.language) {
      newItem['language'] = item.language;
    }

    if (item['itunes:title']) {
      _yaar['itunes:title'] = item['itunes:title'];
    }
    if (item['itunes:block']) {
      _yaar['itunes:block'] = item['itunes:block'];
    }
    if (item['itunes:episodeType']) {
      _yaar['itunes:episodeType'] = item['itunes:episodeType'];
    }
    if (item['itunes:season']) {
      _yaar['itunes:season'] = parseInt(item['itunes:season'], 10);
    }
    if (item['itunes:episode']) {
      _yaar['itunes:episode'] = parseInt(item['itunes:episode'], 10);
    }
    if (item['itunes:explicit']) {
      _yaar['itunes:explicit'] = item['itunes:explicit'];
    }
    if (item.pubDate) {
      _yaar['date_published_short'] = item.pubDate;
    }
    if (item.pubDateMs) {
      _yaar['date_published_ms'] = item.pubDateMs;
    }

    newItem['_yaar'] = _yaar;
    return newItem;
  }

  getJsonData() {
    const publicContent = {
      version: 'https://jsonfeed.org/version/1.1',
      ...this._buildPublicContentChannel(this.content),
    };

    const { items } = this.content;
    const existingitems = items || [];
    publicContent['items'] = [];
    existingitems.forEach((item) => {
      if (![STATUSES.PUBLISHED, STATUSES.UNLISTED].includes(item.status)) {
        return;
      }
      this._decorateForItem(item, this.baseUrl);
      const mediaFile = item.mediaFile || {};
      const newItem = this._buildPublicContentItem(item, mediaFile);
      publicContent.items.push(newItem);
    })

    // Note: We don't proactively sort items based on itunes:type.
    //       Instead, we rely on ?sort= query param and settings
    // if (channel['itunes:type'] === 'episodic') {
    //   publicContent.items.sort((a, b) => b['_yaar']['date_published_ms'] - a['_yaar']['date_published_ms']);
    // } else {
    //   publicContent.items.sort((a, b) => a['_yaar']['date_published_ms'] - b['_yaar']['date_published_ms']);
    // }

    publicContent['_yaar'] = this._buildPublicContentyaarExtra(publicContent);
    return publicContent;
  }
}
